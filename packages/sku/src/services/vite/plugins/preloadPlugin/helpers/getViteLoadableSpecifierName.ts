import * as t from '@babel/types';
import type { NodePath } from '@babel/traverse';
import { VITE_LOADABLE_NAME } from './constants.js';

export const getViteLoadableSpecifierName = (
  importPath: NodePath<t.ImportDeclaration>,
) => {
  for (const specifier of importPath.node.specifiers) {
    if (
      t.isImportSpecifier(specifier) &&
      t.isIdentifier(specifier.imported, { name: VITE_LOADABLE_NAME })
    ) {
      return specifier.local.name;
    }
  }

  return VITE_LOADABLE_NAME;
};
