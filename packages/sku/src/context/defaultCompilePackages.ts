import { dirname, posix as path } from 'node:path';
import chalk from 'chalk';
import { fdir as Fdir } from 'fdir';
import _debug from 'debug';
import { createRequire } from 'node:module';
import { existsSync, opendirSync } from 'node:fs';

import {
  toPosixPath,
  rootDir,
  isPnpm,
  banner,
  packageManager,
} from '@sku-private/utils';

type CompilePackagesResult = {
  names: string[];
  paths: string[];
};

const debug = _debug('sku:compilePackages');
const require = createRequire(import.meta.url);

const seekDependencyGlob = '**/@seek/*/package.json';

const makePnpmVirtualStorePath = (_rootDir: string) =>
  path.join(toPosixPath(_rootDir), 'node_modules/.pnpm');

const isPnpmVirtualStorePopulated = ({
  pnpmVirtualStorePath,
}: {
  pnpmVirtualStorePath: string;
}) => {
  const dir = opendirSync(pnpmVirtualStorePath);
  let count = 0;

  try {
    while (dir.readSync() !== null) {
      count++;

      // PNPM repos will always have a `lock.yaml` file inside the virtual store, even if
      // `nodeLinker=hoisted` is set, so we assume it's populated as long as it contains
      // at least 2 entries
      if (count > 1) {
        return true;
      }
    }
  } finally {
    // Directory handle must be closed manually when using the sync API
    dir.closeSync();
  }

  return false;
};

const buildCrawler = ({ rootDir: _rootDir }: { rootDir: string }) => {
  const pnpmVirtualStorePath = makePnpmVirtualStorePath(_rootDir);

  // If there is a pnpm virtual store directory and it is populated, then we should crawl it.
  // In all other cases we can assume that either npm or yarn is in use, or `nodeLinker=hoisted` has
  // been set, in which case we crawl only the top-level `node_modules` directory.
  const shouldCrawlPnpmVirtualStore =
    existsSync(pnpmVirtualStorePath) &&
    isPnpmVirtualStorePopulated({ pnpmVirtualStorePath });

  if (!shouldCrawlPnpmVirtualStore) {
    return new Fdir()
      .withFullPaths()
      .glob(seekDependencyGlob)
      .crawl('./node_modules/@seek');
  }

  if (!isPnpm) {
    banner(
      'error',
      `pnpm virtual store found, but ${packageManager} is in use`,
      [
        'Please use pnpm to build your project or remove the `node_modules/.pnpm` directory.',
        'Different package managers expect different `node_modules` structures.',
        'Running commands with a different package manager may cause unexpected behaviour.',
      ],
    );
  }

  return new Fdir()
    .withFullPaths()
    .glob(seekDependencyGlob)
    .crawl(path.relative('.', pnpmVirtualStorePath));
};

const reducePackagePaths = (packagePaths: string[]): CompilePackagesResult => {
  const result = packagePaths.reduce<CompilePackagesResult>(
    (acc, packagePath) => {
      const packageJson = require(packagePath);
      if (!packageJson.skuCompilePackage) {
        return acc;
      }
      acc.names.push(packageJson.name);
      acc.paths.push(dirname(packagePath));
      return acc;
    },
    { names: [], paths: [] },
  );
  debug(result.names);
  return result;
};

// Shared cache for both sync and async results.
let cachedResult: CompilePackagesResult | undefined;
// Share any in-progress async crawls.
let inFlight: Promise<CompilePackagesResult> | undefined;
const emptyResult: CompilePackagesResult = { names: [], paths: [] };

const handleError = (e: unknown): CompilePackagesResult => {
  console.log(
    chalk.red`Warning: Failed to detect compile packages. Contact #sku-support.`,
  );
  console.error(e);
  return emptyResult;
};

export const detectedCompilePackagesSync = (): CompilePackagesResult => {
  if (cachedResult) {
    return cachedResult;
  }

  // If there's no rootDir, we're either inside `sku init`, or we can't determine the user's
  // package manager. In either case, we can't correctly detect compile packages.
  if (!rootDir) {
    cachedResult = emptyResult;
    return cachedResult;
  }

  try {
    cachedResult = reducePackagePaths(buildCrawler({ rootDir }).sync());
  } catch (e) {
    cachedResult = handleError(e);
  }

  return cachedResult;
};

export const detectedCompilePackages =
  async (): Promise<CompilePackagesResult> => {
    if (cachedResult) {
      return cachedResult;
    }
    if (inFlight) {
      return inFlight;
    }

    // If there's no rootDir, we're either inside `sku init`, or we can't determine the user's
    // package manager. In either case, we can't correctly detect compile packages.
    if (!rootDir) {
      cachedResult = emptyResult;
      return cachedResult;
    }

    inFlight = (async () => {
      try {
        return reducePackagePaths(
          await buildCrawler({ rootDir }).withPromise(),
        );
      } catch (e) {
        return handleError(e);
      }
    })();

    try {
      cachedResult = await inFlight;
      return cachedResult;
    } finally {
      inFlight = undefined;
    }
  };

export const defaultCompilePackages = ['sku', 'braid-design-system'];
