import { parse, Lang } from '@ast-grep/napi';

export const transform = (source: string) => {
  const ast = parse(Lang.TypeScript, source);
  const root = ast.root();
  const node = root.find("import $IMPORT_NAME from 'sku/@loadable/component';");

  if (!node) {
    return false;
  }

  const importName = node.getMatch('IMPORT_NAME')?.text();

  const importStatement =
    importName === 'loadable' ? 'loadable' : `loadable as ${importName}`;

  const edit = node.replace(
    `import { ${importStatement} } from 'sku/vite/loadable';`,
  );

  return root.commitEdits([edit]);
};
