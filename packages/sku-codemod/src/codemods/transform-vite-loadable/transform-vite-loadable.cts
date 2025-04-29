import type { API, FileInfo } from 'jscodeshift';

export default function transformer(file: FileInfo, api: API) {
  const j = api.jscodeshift;
  const root = j(file.source);

  root.find(j.ImportDeclaration).forEach((path) => {
    if (path.node.source.value === 'sku/@loadable/component') {
      const importName =
        path.node.specifiers?.[0].local?.name.toString() || 'loadable';
      j(path).replaceWith(
        j.importDeclaration(
          [
            j.importSpecifier(
              j.identifier('loadable'),
              j.identifier(importName),
            ),
          ],
          j.literal('sku/vite/loadable'),
        ),
      );
    }
  });

  return root.toSource({ quote: 'single' });
}
