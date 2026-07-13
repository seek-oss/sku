import { parse } from '@babel/parser';
import _traverse, { type NodePath } from '@babel/traverse';
import _generate, { type GeneratorResult } from '@babel/generator';
import * as t from '@babel/types';
import { resolveManifestModuleId } from '../../helpers/resolveManifestModuleId.js';

// CJS/ESM interop for @babel/* — Vite SSR and Vitest resolve these differently.

const traverse = ((_traverse as any).default ??
  _traverse) as typeof _traverse.default;

const generate = ((_generate as any).default ??
  _generate) as typeof _generate.default;

const getPropertyName = (
  key: t.ObjectProperty['key'],
  computed: boolean,
): string | null => {
  if (computed) {
    return null;
  }
  if (t.isIdentifier(key)) {
    return key.name;
  }
  if (t.isStringLiteral(key)) {
    return key.value;
  }
  return null;
};

const getSingleStringLiteralImportPath = (
  lazyValue: t.ObjectProperty['value'],
): string | null => {
  if (
    !t.isArrowFunctionExpression(lazyValue) &&
    !t.isFunctionExpression(lazyValue)
  ) {
    return null;
  }

  const importPaths: string[] = [];
  // Clone before wrapping — do not re-parent the live AST node.
  const file = t.file(
    t.program([t.expressionStatement(t.cloneNode(lazyValue, true))]),
  );

  traverse(file, {
    CallExpression(path) {
      if (!path.get('callee').isImport()) {
        return;
      }
      const arg = path.node.arguments[0];
      if (path.node.arguments.length === 1 && t.isStringLiteral(arg)) {
        importPaths.push(arg.value);
        return;
      }
      // Non-string or multi-arg import() — treat as non-idiomatic.
      importPaths.push('');
    },
  });

  if (importPaths.length !== 1 || importPaths[0] === '') {
    return null;
  }

  return importPaths[0] ?? null;
};

const findObjectProperty = (
  objectPath: NodePath<t.ObjectExpression>,
  name: string,
): NodePath<t.ObjectProperty> | undefined =>
  objectPath
    .get('properties')
    .find(
      (prop): prop is NodePath<t.ObjectProperty> =>
        prop.isObjectProperty() &&
        getPropertyName(prop.node.key, prop.node.computed) === name,
    );

const hasExplicitModuleId = (
  handlePath: NodePath<t.ObjectProperty>,
): boolean => {
  const valuePath = handlePath.get('value');
  if (!valuePath.isObjectExpression()) {
    // Non-object handle (identifier, call, …) — do not guess or overwrite.
    return true;
  }

  return valuePath
    .get('properties')
    .some(
      (prop) =>
        prop.isObjectProperty() &&
        getPropertyName(prop.node.key, prop.node.computed) === 'moduleId',
    );
};

const ensureHandleModuleId = (
  objectPath: NodePath<t.ObjectExpression>,
  moduleId: string,
): boolean => {
  const handlePath = findObjectProperty(objectPath, 'handle');

  if (handlePath) {
    if (hasExplicitModuleId(handlePath)) {
      return false;
    }

    const valuePath = handlePath.get('value');
    if (!valuePath.isObjectExpression()) {
      return false;
    }

    valuePath.node.properties.push(
      t.objectProperty(t.identifier('moduleId'), t.stringLiteral(moduleId)),
    );
    return true;
  }

  objectPath.node.properties.push(
    t.objectProperty(
      t.identifier('handle'),
      t.objectExpression([
        t.objectProperty(t.identifier('moduleId'), t.stringLiteral(moduleId)),
      ]),
    ),
  );
  return true;
};

export const injectLazyRouteModuleId = ({
  code,
  id,
  cwd,
}: {
  code: string;
  id: string;
  cwd?: string;
}): { code: string; map: GeneratorResult['map']; injected: boolean } | null => {
  if (!code.includes('lazy') || !code.includes('import(')) {
    return null;
  }

  const ast = parse(code, {
    sourceType: 'module',
    plugins: ['jsx', 'typescript'],
  });

  let injected = false;

  traverse(ast, {
    ObjectProperty(propertyPath) {
      if (
        getPropertyName(propertyPath.node.key, propertyPath.node.computed) !==
        'lazy'
      ) {
        return;
      }

      // Granular `lazy: { … }` / indirect bindings / non-functions — skip.
      const importPath = getSingleStringLiteralImportPath(
        propertyPath.node.value,
      );
      if (!importPath) {
        return;
      }

      const parent = propertyPath.parentPath;
      if (!parent.isObjectExpression()) {
        return;
      }

      const moduleId = resolveManifestModuleId({
        importerId: id,
        importPath,
        cwd,
      });
      if (!moduleId) {
        return;
      }

      if (ensureHandleModuleId(parent, moduleId)) {
        injected = true;
      }
    },
  });

  if (!injected) {
    return null;
  }

  const output = generate(ast, { retainLines: true }, code);
  return {
    code: output.code,
    map: output.map,
    injected: true,
  };
};
