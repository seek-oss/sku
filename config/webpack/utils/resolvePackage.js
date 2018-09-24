const path = require('path');
const memoize = require('memoizee');
const chalk = require('chalk');
const debug = require('debug')('sku:resolvePackage');

const getProjectDependencies = readFileSync => {
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
};

/**
 * Resolve a package name to an absolute path.
 * e.g. my-package -> /Users/me/code/my-project/node_modules/my-package
 *
 * Throws if a package is listed in the project's dependencies and cannot be resolved.
 */
const createPackageResolver = (fs, resolve) =>
  memoize(function resolvePackage(packageName) {
    const cwd = process.cwd();

    // First, look for a local copy of the package. If it exists, we're done.
    const localPackage = path.join(cwd, 'node_modules', packageName);

    if (fs.existsSync(localPackage)) {
      debug(`Resolved ${packageName} to ${localPackage}`);
      return localPackage;
    }

    // If there's no local package, check to see if the project has it as a dependency. If it does
    // we'll try and track it down, if not we'll return a naive local path. This prevents webpack
    // from throwing invalid config errors.
    const dependencies = getProjectDependencies(fs.readFileSync);

    if (!dependencies[packageName]) {
      debug(`Resolved ${packageName} to ${localPackage}`);
      return localPackage;
    }

    // If we don't find a local copy we use Node's require algorithm to find one.
    // This branch is used when sku or seek-style-guide have been `npm link`ed into a project,
    // and also by the seek-style-guide.test.js sku test.
    // Doing this can produce hard-to-debug build issues, so we log a warning.
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
  });

module.exports = {
  resolvePackage: createPackageResolver(require('fs'), require.resolve),
  createPackageResolver
};
