const { posix: path } = require('path');
const chalk = require('chalk');
const glob = require('fast-glob');

const { cwd: skuCwd } = require('../lib/cwd');
const toPosixPath = require('../lib/toPosixPath');

const { rootDir, isPnpm } = require('../lib/packageManager');

/** @type {string[]} */
let detectedCompilePackages = [];

try {
  const globs = ['node_modules/@seek/*/package.json'];
  const cwd = skuCwd();

  // `rootDir` is nullable, but while we have `strict: false` in our TSConfig it won't appear nullable
  // It will be null during sku init, but we don't really care about detecting compile packages at that point anyway
  if (isPnpm && rootDir) {
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
  console.error(e);
}

module.exports = [
  'sku',
  'braid-design-system',
  ...new Set(detectedCompilePackages),
];
