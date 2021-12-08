const skuPath = require.resolve('sku/package.json');

const modules = ['node_modules'];

// If the project is using pnpm then we add the sku node_modules directory
// to the modules array. This allows dependecies of sku to be importable
// as part of the build process. This is specifically useful for
// @babel/plugin-transform-runtime as it inject imports to @babel/runtime.
if (skuPath.includes('.pnpm')) {
  modules.push(path.join(skuPath, '../..'));
}

module.exports = modules;
