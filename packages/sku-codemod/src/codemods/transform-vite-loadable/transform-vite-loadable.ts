import { parse, Lang } from '@ast-grep/napi';

export const transform = (source: string) => {
  const ast = parse(Lang.TypeScript, source);
  const root = ast.root();

  const importStatement = root.find({
    rule: {
      kind: 'import_statement',
      all: [
        {
          has: {
            kind: 'string',
            pattern: "'sku/@loadable/component'",
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
    return false;
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
    return false;
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

  const loadableImportStatement = `import { ${identifierName} } from 'sku/vite/loadable';`;
  const loadableReadyImportStatement = namedImports
    ? `import ${namedImports.text()} from 'sku/@loadable/component';\n`
    : '';

  const edit = importStatement.replace(
    [loadableReadyImportStatement, loadableImportStatement].join(''),
  );

  return root.commitEdits([edit]);
};
