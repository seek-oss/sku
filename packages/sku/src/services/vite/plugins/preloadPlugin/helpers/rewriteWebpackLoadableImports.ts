import { parse } from '@babel/parser';
import _traverse from '@babel/traverse';
import _generate from '@babel/generator';
import * as t from '@babel/types';
import { VITE_LOADABLE_IMPORT, WEBPACK_LOADABLE_IMPORT } from './constants.js';
import { getWebpackLoadableSpecifierName } from './getWebpackLoadableSpecifierName.js';
import { convertWebpackToViteImport } from './convertWebpackToViteImport.js';

// These packages are CJS. Node's interop nests their export under `default`, while a
// bundler's interop unwraps it.
const traverse = _traverse.default ?? _traverse;
const generate = _generate.default ?? _generate;

export const parseLoadableSource = (code: string) =>
  parse(code, {
    sourceType: 'unambiguous',
    plugins: ['jsx', 'typescript'],
  });

export const assertSingleLoadableRuntime = (code: string, id: string) => {
  const hasWebpack = code.includes(WEBPACK_LOADABLE_IMPORT);
  const hasVite = code.includes(VITE_LOADABLE_IMPORT);

  if (hasWebpack && hasVite) {
    throw new Error(
      `Both ${WEBPACK_LOADABLE_IMPORT} and ${VITE_LOADABLE_IMPORT} imports found in ${id}. Please remove one of them.`,
    );
  }

  return { hasWebpack, hasVite };
};

/**
 * Rewrites webpack loadable default imports to their Vite equivalent on an existing AST.
 */
export const rewriteWebpackLoadableImportsInAst = (ast: t.File): void => {
  traverse(ast, {
    ImportDeclaration(importPath) {
      if (
        !t.isStringLiteral(importPath.node.source, {
          value: WEBPACK_LOADABLE_IMPORT,
        })
      ) {
        return;
      }

      const localName = getWebpackLoadableSpecifierName(importPath);
      // named-only imports (e.g. `loadableReady`) have no Vite equivalent
      if (!localName) {
        return;
      }

      convertWebpackToViteImport(importPath, localName);
    },
  });
};

export const rewriteWebpackLoadableImports = (
  code: string,
  id = 'unknown',
): ReturnType<typeof generate> | null => {
  const { hasWebpack } = assertSingleLoadableRuntime(code, id);
  if (!hasWebpack) {
    return null;
  }

  const ast = parseLoadableSource(code);
  rewriteWebpackLoadableImportsInAst(ast);
  return generate(ast, {}, code);
};
