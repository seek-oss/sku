const path = require('path');
const memoize = require('memoizee');
const chalk = require('chalk');
const debug = require('debug')('sku:resolvePackage');

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
    const cwd = process.cwd();

    // First, look for a copy of the package in the project's node_modules.
    // If it exists, we're done.
    const localPackage = path.join(cwd, 'node_modules', packageName);

    if (fs.existsSync(localPackage)) {
      debug(`Resolved ${packageName} to ${localPackage}`);
      return localPackage;
    }

    // If there's no local package, check to see if it's listed as a project dependency. If it is
    // we'll try and track it down, if not we'll return a naive local path.
    // This branch handles the scenario where we're trying to resolve seek-style-guide because
    // it's on the default list of compilePackages, but it's not actually being used in the project.
    // Returning a naive path prevents webpack from throwing config schema errors.
    const dependencies = getProjectDependencies(fs.readFileSync);

    if (!dependencies[packageName]) {
      debug(`Resolved ${packageName} to ${localPackage}`);
      return localPackage;
    }

    // We haven't found a copy of the package in the project node_modules directory, and we know
    // it's listed as a project dependency, so we use Node's require algorithm to track it down.
    // This branch is used when sku or seek-style-guide have been `npm link`ed into a project,
    // and also by the seek-style-guide.test.js sku test.
    // Doing this can produce hard-to-debug build issues, so we log a warning.
    // `resolve` will throw if the package name can't be resolved.
    const resolvedPackage = path.dirname(
      resolve(`${packageName}/package.json`)
    );

    console.warn(
      chalk.yellow(
        [
          `WARNING! Sku failed to find the \`${packageName}\` package in this project.`,
          `It found a copy at ${resolvedPackage}, which may result in strange behaviour!`,
          `You should probably \`npm install\` the package into your project.`
        ].join('\n')
      )
    );

    debug(`Resolved ${packageName} to ${resolvedPackage}`);
    return resolvedPackage;
  }

  return memoize(resolvePackage);
};

function getProjectDependencies(readFileSync) {
  let pkg;

  try {
    pkg = JSON.parse(readFileSync(`${process.cwd()}/package.json`).toString());
  } catch (error) {
    if (error.code === 'ENOENT') {
      pkg = {};
    } else {
      throw error;
    }
  }

  return {
    ...(pkg.dependencies || {}),
    ...(pkg.devDependencies || {})
  };
}

module.exports = {
  resolvePackage: createPackageResolver(require('fs'), require.resolve),
  createPackageResolver
};
