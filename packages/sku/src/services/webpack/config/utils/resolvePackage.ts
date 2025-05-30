import { join, dirname } from 'node:path';
import nodeFs from 'node:fs';
import nanoMemoize from 'nano-memoize';
import debug from 'debug';
import { createRequire } from 'node:module';

import { cwd } from '@/utils/cwd.js';
import { hasErrorCode } from '@/utils/error-guards.js';

// @ts-expect-error
const memoize = nanoMemoize?.default || nanoMemoize;

const log = debug('sku:resolvePackage');

const require = createRequire(import.meta.url);

function getProjectDependencies(readFileSync: typeof nodeFs.readFileSync) {
  let pkg;

  try {
    pkg = JSON.parse(readFileSync(`${cwd()}/package.json`).toString());
  } catch (error) {
    if (hasErrorCode(error) && error.code === 'ENOENT') {
      pkg = {};
    } else {
      throw error;
    }
  }

  return {
    ...(pkg.dependencies || {}),
    ...(pkg.devDependencies || {}),
  };
}

/**
 * Create a `resolvePackage` function.
 *
 * This wrapper let's us inject fs and require dependencies for testing.
 */
export const createPackageResolver = (
  fs: typeof nodeFs /** Node's fs module */,
  resolve: RequireResolve /** Node's require.resolve */,
): ((packageName: string) => string) => {
  /**
   * Resolve a package name to an absolute path.
   * e.g. my-package -> /Users/me/code/my-project/node_modules/my-package
   *
   * Throws if a package is listed in the project's dependencies and cannot be resolved.
   */
  function resolvePackage(packageName: string) {
    try {
      // First, try to use require.resolve to find the package.
      // We add /package.json and then dirname the result because require.resolve follows the `main`
      // property in package.json to produce a path to a file deep inside the package, and we want
      // the path to the top-level directory.
      // This branch handles packages being symlinked into node_modules, for example with
      // `npm link` or in sku's test cases.
      const result = dirname(
        resolve(`${packageName}/package.json`, { paths: [cwd()] }),
      );
      log(`Resolved ${packageName} to ${result}`);
      return result;
    } catch (error: unknown) {
      if (hasErrorCode(error) && error.code === 'MODULE_NOT_FOUND') {
        const dependencies = getProjectDependencies(fs.readFileSync);

        if (!dependencies[packageName]) {
          // If it's not we can safely return a naive local path, which prevents webpack from
          // throwing config schema errors when this function is used to configure a loader.
          // This branch handles the scenario where we're trying to resolve a design system module because
          // it's in the default list of compilePackages, but it's not actually being used in the project.
          const localPackage = join(cwd(), 'node_modules', packageName);
          log(`Resolved unused package ${packageName} to ${localPackage}`);
          return localPackage;
        }
      }

      // We've gotten this far because the package is listed as a project dependency and can't be
      // resolved, or because the error is not ENOENT. In either case we want to throw.
      throw error;
    }
  }

  return memoize(resolvePackage);
};

export const resolvePackage = createPackageResolver(nodeFs, require.resolve);
