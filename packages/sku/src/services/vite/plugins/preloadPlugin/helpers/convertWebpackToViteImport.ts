import * as t from '@babel/types';
import {
  VITE_LOADABLE_IMPORT,
  VITE_LOADABLE_NAME,
  WEBPACK_LOADABLE_IMPORT,
} from './constants.js';
import type { NodePath } from '@babel/traverse';

export const convertWebpackToViteImport = (
  importPath: NodePath<t.ImportDeclaration>,
  localName: string,
) => {
  const viteImport = t.importDeclaration(
    [
      t.importSpecifier(
        t.identifier(localName),
        t.identifier(VITE_LOADABLE_NAME),
      ),
    ],
    t.stringLiteral(VITE_LOADABLE_IMPORT),
  );

  // Anything imported alongside the default specifier, e.g. `loadableReady`, has no
  // vite equivalent, so it keeps its original import.
  const remainingSpecifiers = importPath.node.specifiers.filter(
    (specifier) => !t.isImportDefaultSpecifier(specifier),
  );

  if (remainingSpecifiers.length === 0) {
    importPath.replaceWith(viteImport);
    return;
  }

  importPath.replaceWithMultiple([
    t.importDeclaration(
      remainingSpecifiers,
      t.stringLiteral(WEBPACK_LOADABLE_IMPORT),
    ),
    viteImport,
  ]);
};
