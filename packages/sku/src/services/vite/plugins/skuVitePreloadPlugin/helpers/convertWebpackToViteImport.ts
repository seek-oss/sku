import * as t from '@babel/types';
import { VITE_LOADABLE_IMPORT } from '@/services/vite/plugins/skuVitePreloadPlugin/helpers/constants.js';
import type { NodePath } from '@babel/traverse';

export const convertWebpackToViteImport = (
  importPath: NodePath<t.ImportDeclaration>,
) => {
  const importSpecifiers = [
    t.importSpecifier(t.identifier('loadable'), t.identifier('loadable')),
  ];

  importPath.replaceWith(
    t.importDeclaration(
      importSpecifiers,
      t.stringLiteral(VITE_LOADABLE_IMPORT),
    ),
  );
};
