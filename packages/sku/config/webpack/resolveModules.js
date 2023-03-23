const path = require('path');

const modules = ['node_modules'];

try {
  const skuPath = require.resolve('sku/package.json');

  // If the project is using pnpm then we add the sku node_modules directory
  // to the modules array. This allows dependecies of sku to be importable
  // as part of the build process. This is specifically useful for
  // @babel/plugin-transform-runtime as it inject imports to @babel/runtime.
  if (skuPath.includes('.pnpm')) {
    modules.push(path.join(skuPath, '../..'));
  }
} catch (e) {
  // Ignore errors as if sku isn't resolvable then we don't need to apply the pnpm fix
}

module.exports = modules;
