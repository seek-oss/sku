import { parse, Lang } from '@ast-grep/napi';
import type { Transform } from '../../utils/types.js';

export const transform: Transform = (source) => {
  const ast = parse(Lang.TypeScript, source);
  const root = ast.root();

  const importStatement = root.find({
    rule: {
      kind: 'import_statement',
      all: [
        {
          has: {
            kind: 'string',
            has: {
              kind: 'string_fragment',
              regex: 'sku\/@loadable\/component',
            },
          },
        },
        {
          has: {
            kind: 'import_clause',
            has: {
              kind: 'identifier',
            },
          },
        },
      ],
    },
  });

  if (!importStatement) {
    // No import statement found for this file.
    return null;
  }

  const identifier = importStatement?.find({
    rule: {
      kind: 'identifier',
      inside: {
        kind: 'import_clause',
      },
    },
  });

  if (!identifier) {
    // no named identifier found for this file.
    return null;
  }

  // Check if the import statement also imports named imports from sku/@loadable/components.
  const namedImports = importStatement?.find({
    rule: {
      kind: 'named_imports',
      inside: {
        kind: 'import_clause',
      },
    },
  });

  const identifierName =
    identifier?.text() === 'loadable'
      ? identifier?.text()
      : `loadable as ${identifier?.text()}`;

  const loadableImportStatement = `import { ${identifierName} } from '@sku-lib/vite/loadable';`;
  const loadableReadyImportStatement = namedImports
    ? `import ${namedImports.text()} from 'sku/@loadable/component';\n`
    : '';

  const edit = importStatement.replace(
    [loadableReadyImportStatement, loadableImportStatement].join(''),
  );

  return root.commitEdits([edit]);
};
