const path = require('path');
const glob = require('fast-glob');

const { cwd } = require('../lib/cwd');

const detectedCompilePackages = glob
  .sync([`node_modules/@seek/*/package.json`], {
    cwd: cwd(),
  })
  .map((packagePath) => {
    const packageJson = require(path.join(cwd(), packagePath));

    return {
      isCompilePackage: Boolean(packageJson.skuCompilePackage),
      packageName: packageJson.name,
    };
  })
  .filter(({ isCompilePackage }) => isCompilePackage)
  .map(({ packageName }) => packageName);

module.exports = [
  'sku',
  'seek-style-guide',
  'seek-asia-style-guide',
  'braid-design-system',
  ...detectedCompilePackages,
];
