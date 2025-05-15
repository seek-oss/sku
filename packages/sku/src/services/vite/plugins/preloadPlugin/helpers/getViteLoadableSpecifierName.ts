import type * as t from '@babel/types';
import type { NodePath } from '@babel/traverse';
import { VITE_LOADABLE_NAME } from './constants.js';

export const getViteLoadableSpecifierName = (
  importPath: NodePath<t.ImportDeclaration>,
) => {
  const loadableNamedSpecifier = importPath
    .get('specifiers')
    .find((specifier) =>
      specifier.isImportSpecifier({
        imported: { name: 'loadable' },
      }),
    );

  return loadableNamedSpecifier?.node.local.name ?? VITE_LOADABLE_NAME;
};
