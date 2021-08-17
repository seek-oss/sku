const path = require('path');
const chalk = require('chalk');
const glob = require('fast-glob');

const { cwd } = require('../lib/cwd');

let detectedCompilePackages = [];

try {
  detectedCompilePackages = glob
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
} catch (e) {
  console.log(
    chalk.red`Warning: Failed to detect compile packages. Contact #sku-support.`,
  );
  console.error(e);
}

module.exports = [
  'sku',
  'seek-style-guide',
  'braid-design-system',
  ...detectedCompilePackages,
];
