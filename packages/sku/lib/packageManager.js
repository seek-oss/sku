const { cwd } = require('../lib/cwd');
const { findRootSync } = require('@manypkg/find-root');

const { sync: which } = require('which');

/** @typedef {'yarn' | 'pnpm' | 'npm'} SupportedPackageManager */

/** @type {Array<SupportedPackageManager>} */
const supportedPackageManagers = ['yarn', 'pnpm', 'npm'];

/**
 * @param {SupportedPackageManager} commandName
 * @returns {SupportedPackageManager | null}
 */
const detectPackageManagerCommand = (commandName) =>
  which(commandName, { nothrow: true }) ? commandName : null;

const detectPackageManager = () => {
  return (
    detectPackageManagerCommand('yarn') ||
    detectPackageManagerCommand('pnpm') ||
    'npm'
  );
};

/**
 * Get the package manager and root directory of the project. If the project does not have a
 * project manager configured, a supported package manager will be detected in your `PATH`, and
 * `rootDir` will be `null`.
 * @returns {{packageManager: SupportedPackageManager, rootDir: string | null}}
 */
const getPackageManager = () => {
  try {
    const { tool, rootDir } = findRootSync(cwd());

    if (!supportedPackageManagers.includes(tool.type)) {
      throw new Error('Unsupported package manager found');
    }

    return { packageManager: tool.type, rootDir };
  } catch {
    const packageManager = detectPackageManager();

    return { packageManager, rootDir: null };
  }
};

const { rootDir, packageManager } = getPackageManager();

const isYarn = packageManager === 'yarn';
const isPnpm = packageManager === 'pnpm';
const isNpm = packageManager === 'npm';

module.exports = { rootDir, packageManager, isYarn, isPnpm, isNpm };
