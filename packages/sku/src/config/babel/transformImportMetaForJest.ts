import { type PluginObj, types as t } from '@babel/core';

/**
 * Jest evaluates transformed modules as CommonJS scripts, which cannot parse
 * `import.meta`. Replace it with an empty object so property access
 * (e.g. `import.meta.hot` in react-router) becomes undefined instead of a
 * SyntaxError.
 */
export default function transformImportMetaForJest(): PluginObj {
  return {
    name: 'sku-transform-import-meta-for-jest',
    visitor: {
      MetaProperty(path) {
        if (
          path.node.meta.name === 'import' &&
          path.node.property.name === 'meta'
        ) {
          path.replaceWith(t.objectExpression([]));
        }
      },
    },
  };
}
