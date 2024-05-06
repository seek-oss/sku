const { posix: path } = require('node:path');
const chalk = require('chalk');
const { fdir: Fdir } = require('fdir');

const { cwd } = require('../lib/cwd');
const toPosixPath = require('../lib/toPosixPath');

const { rootDir, isPnpm } = require('../lib/packageManager');
const debug = require('debug')('sku:compilePackages');

/** @type {string[]} */
let detectedCompilePackages = [];

// If there's no rootDir, we're either inside `sku init`, or we can't determine the user's
// package manager. In either case, we can't correctly detect compile packages.
if (rootDir) {
  try {
    let crawler = new Fdir();

    if (isPnpm) {
      // Follow symlinks inside node_modules into the pnpm virtual store
      crawler = crawler.withSymlinks().withRelativePaths();
    } else {
      crawler = crawler.withBasePath();
    }

    const seekDependencyGlob = '**/@seek/*/package.json';

    let results = crawler
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
        .withRelativePaths()
        .glob(seekDependencyGlob)
        .crawl(pnpmVirtualStoreRelativePath)
        .sync();

      results.push(...pnpmVirtualStoreResults);

      // All results will be relative to the virtual store directory, so we need
      // to prepend the relative path from the current directory to the virtual store
      results = results.map((file) =>
        path.join(pnpmVirtualStoreRelativePath, file),
      );
    }

    detectedCompilePackages = results
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
}

debug(detectedCompilePackages);

module.exports = [
  'sku',
  'braid-design-system',
  ...new Set(detectedCompilePackages),
];
