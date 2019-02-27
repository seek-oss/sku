const path = require('path');
const memoize = require('memoizee');
const debug = require('debug')('sku:resolvePackage');
const { cwd } = require('../../../lib/cwd');

function getProjectDependencies(readFileSync) {
  let pkg;

  try {
    pkg = JSON.parse(readFileSync(`${cwd()}/package.json`).toString());
  } catch (error) {
    if (error.code === 'ENOENT') {
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
 *
 * @param {Object} fs - Node's fs module
 * @param {Function} resolve - Node's require.resolve
 */
const createPackageResolver = (fs, resolve) => {
  /**
   * Resolve a package name to an absolute path.
   * e.g. my-package -> /Users/me/code/my-project/node_modules/my-package
   *
   * Throws if a package is listed in the project's dependencies and cannot be resolved.
   */
  function resolvePackage(packageName) {
    try {
      // First, try to use require.resolve to find the package.
      // We add /package.json and then dirname the result because require.resolve follows the `main`
      // property in package.json to produce a path to a file deep inside the package, and we want
      // the path to the top-level directory.
      // This branch handles packages being symlinked into node_modules, for example with
      // `npm link` or in sku's test cases.
      const result = path.dirname(
        resolve(`${packageName}/package.json`, { paths: [cwd()] }),
      );
      debug(`Resolved ${packageName} to ${result}`);
      return result;
    } catch (error) {
      if (error.code === 'MODULE_NOT_FOUND') {
        const dependencies = getProjectDependencies(fs.readFileSync);

        if (!dependencies[packageName]) {
          // If it's not we can safely return a naive local path, which prevents webpack from
          // throwing config schema errors when this function is used to configure a loader.
          // This branch handles the scenario where we're trying to resolve a design system module because
          // it's in the default list of compilePackages, but it's not actually being used in the project.
          const localPackage = path.join(cwd(), 'node_modules', packageName);
          debug(`Resolved unused package ${packageName} to ${localPackage}`);
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

module.exports = {
  resolvePackage: createPackageResolver(require('fs'), require.resolve),
  createPackageResolver,
};
