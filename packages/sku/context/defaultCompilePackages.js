const { posix: path } = require('path');
const chalk = require('chalk');
const glob = require('fast-glob');

const { cwd: skuCwd } = require('../lib/cwd');
const toPosixPath = require('../lib/toPosixPath');

const { findRootSync } = require('@manypkg/find-root');

/** @type {string[]} */
let detectedCompilePackages = [];

try {
  const globs = ['node_modules/@seek/*/package.json'];
  const cwd = skuCwd();

  const { rootDir, tool } = findRootSync(cwd);

  if (tool === 'pnpm') {
    const pnpmVirtualStorePath = path.join(
      toPosixPath(rootDir),
      'node_modules/.pnpm',
    );
    const pnpmVirtualStoreRelativePath = path.relative(
      '.',
      pnpmVirtualStorePath,
    );
    const pnpmVirtualStoreGlob = path.join(
      pnpmVirtualStoreRelativePath,
      '@seek*/node_modules/@seek/*/package.json',
    );

    globs.push(pnpmVirtualStoreGlob);
  }

  detectedCompilePackages = glob
    .sync(globs, {
      cwd,
    })
    .map((packagePath) => {
      const packageJson = require(path.join(cwd, packagePath));

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
}

module.exports = [
  'sku',
  'braid-design-system',
  ...new Set(detectedCompilePackages),
];
