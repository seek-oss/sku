const { posix: path } = require('path');
const chalk = require('chalk');
const glob = require('fast-glob');
const { execSync } = require('child_process');

const { cwd: skuCwd } = require('../lib/cwd');
const toPosixPath = require('../lib/toPosixPath');

/** @type {string[]} */
let detectedCompilePackages = [];

try {
  const cwd = skuCwd();
  const gitRepoRoot = execSync('git rev-parse --show-toplevel', { cwd })
    .toString()
    .trim();

  const pnpmVirtualStorePath = path.join(
    toPosixPath(gitRepoRoot),
    'node_modules/.pnpm',
  );
  const pnpmVirtualStoreGlob = path.join(
    pnpmVirtualStorePath,
    '@seek*/node_modules/@seek/*/package.json',
  );
  const packageDependenciesGlob = 'node_modules/@seek/*/package.json';

  detectedCompilePackages = glob
    .sync([pnpmVirtualStoreGlob, packageDependenciesGlob], {
      cwd,
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
  'braid-design-system',
  ...new Set(detectedCompilePackages),
];
