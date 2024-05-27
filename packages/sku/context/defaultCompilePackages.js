const { posix: path } = require('node:path');
const chalk = require('chalk');
const { fdir: Fdir } = require('fdir');

const toPosixPath = require('../lib/toPosixPath');

const { rootDir, isPnpm } = require('../lib/packageManager');
const debug = require('debug')('sku:compilePackages');

/** @type {string[]} */
let detectedCompilePackages = [];

// If there's no rootDir, we're either inside `sku init`, or we can't determine the user's
// package manager. In either case, we can't correctly detect compile packages.
if (rootDir) {
  try {
    // Always use full paths so we don't need to worry about joining paths later
    let crawler = new Fdir().withFullPaths();

    if (isPnpm) {
      // Follow symlinks inside node_modules into the pnpm virtual store
      crawler = crawler.withSymlinks();
    }

    const seekDependencyGlob = '**/@seek/*/package.json';

    const results = crawler
      .glob(seekDependencyGlob)
      .crawl('./node_modules/@seek')
      .sync();

    if (isPnpm) {
      const pnpmVirtualStorePath = path.join(
        toPosixPath(rootDir),
        'node_modules/.pnpm',
      );

      const pnpmVirtualStoreRelativePath = path.relative(
        '.',
        pnpmVirtualStorePath,
      );

      const pnpmVirtualStoreResults = new Fdir()
        .withFullPaths()
        .glob(seekDependencyGlob)
        .crawl(pnpmVirtualStoreRelativePath)
        .sync();

      results.push(...pnpmVirtualStoreResults);
    }

    detectedCompilePackages = results
      .map((packagePath) => {
        const packageJson = require(packagePath);

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
}

debug(detectedCompilePackages);

module.exports = [
  'sku',
  'braid-design-system',
  ...new Set(detectedCompilePackages),
];
