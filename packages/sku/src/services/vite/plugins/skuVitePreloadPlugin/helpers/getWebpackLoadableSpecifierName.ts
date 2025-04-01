import type * as t from '@babel/types';
import type { NodePath } from '@babel/traverse';

export const getWebpackLoadableSpecifierName = (
  importPath: NodePath<t.ImportDeclaration>,
) => {
  const defaultSpecifier = importPath
    .get('specifiers')
    .find((specifier) => specifier.isImportDefaultSpecifier());

  return defaultSpecifier?.node.local.name ?? 'loadable';

  // TODO: Handle loadable ready.
};
