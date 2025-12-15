import { posix as path } from 'node:path';
import chalk from 'chalk';
import { fdir as Fdir } from 'fdir';
import _debug from 'debug';
import { createRequire } from 'node:module';

import {
  toPosixPath,
  rootDir,
  isPnpm,
  banner,
  packageManager,
} from '@sku-private/utils';
import { existsSync } from 'node:fs';
import { styleText } from 'node:util';

const debug = _debug('sku:compilePackages');

const require = createRequire(import.meta.url);

let detectedCompilePackages: string[] = [];

// If there's no rootDir, we're either inside `sku init`, or we can't determine the user's
// package manager. In either case, we can't correctly detect compile packages.
if (rootDir) {
  try {
    const pnpmVirtualStorePath = path.join(
      toPosixPath(rootDir),
      'node_modules/.pnpm',
    );
    const hasPnpmVirtualStore = existsSync(pnpmVirtualStorePath);

    if (hasPnpmVirtualStore && !isPnpm) {
      banner(
        'error',
        `${styleText('bold', 'pnpm')} virtual store found, but ${styleText('bold', packageManager)} is in use`,
        [
          'Please use pnpm to build your project or remove the `node_modules/.pnpm` directory.',
          'Different package managers expect different `node_modules` structures.',
          'Running commands with a different package manager may cause unexpected behaviour.',
        ],
      );
    }

    // Always use full paths so we don't need to worry about joining paths later
    let crawler = new Fdir().withFullPaths();

    if (hasPnpmVirtualStore) {
      // Follow symlinks inside node_modules into the pnpm virtual store
      crawler = crawler.withSymlinks();
    }

    const seekDependencyGlob = '**/@seek/*/package.json';

    const results = crawler
      .glob(seekDependencyGlob)
      .crawl('./node_modules/@seek')
      .sync();

    if (hasPnpmVirtualStore) {
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

export default [
  'sku',
  'braid-design-system',
  ...new Set(detectedCompilePackages),
];
