const { cwd } = require('../lib/cwd');
const { findRootSync } = require('@manypkg/find-root');
const { getCommand, INSTALL_PAGE } = require('@antfu/ni');

const { sync: which } = require('which');
const skuArgs = require('../config/args');

/** @typedef {'yarn' | 'pnpm' | 'npm'} SupportedPackageManager */

/** @type {Array<SupportedPackageManager>} */
const supportedPackageManagers = ['yarn', 'pnpm', 'npm'];

/**
 * @param {SupportedPackageManager} commandName
 * @returns {SupportedPackageManager | null}
 */
const detectPackageManagerCommand = (commandName) =>
  which(commandName, { nothrow: true }) ? commandName : null;

const detectPackageManager = () =>
  detectPackageManagerCommand('yarn') ||
  detectPackageManagerCommand('pnpm') ||
  'npm';

/**
 * Get the package manager and root directory of the project. If the project does not have a
 * project manager configured, a supported package manager will be detected in your `PATH`, and
 * `rootDir` will be `null`.
 * @returns {{packageManager: SupportedPackageManager, rootDir: string | null}}
 */
const getPackageManager = () => {
  let _packageManager = skuArgs?.packageManager;

  try {
    const {
      tool: { type: foundPackageManager },
      rootDir,
    } = findRootSync(cwd());

    if (!supportedPackageManagers.includes(foundPackageManager)) {
      throw new Error('Unsupported package manager found');
    }

    _packageManager ||= foundPackageManager;

    return { packageManager: _packageManager, rootDir };
  } catch {
    _packageManager ||= detectPackageManager();

    return { packageManager: _packageManager, rootDir: null };
  }
};

const { rootDir, packageManager } = getPackageManager();

const isYarn = packageManager === 'yarn';
const isPnpm = packageManager === 'pnpm';
const isNpm = packageManager === 'npm';

/**
 * @param {string} scriptName
 */
const getRunCommand = (scriptName) =>
  getCommand(packageManager, 'run', [scriptName]);

/**
 * @param {string[]} args
 */
const getExecuteCommand = (args) => getCommand(packageManager, 'execute', args);

/** @type {Record<SupportedPackageManager, string[]>} */
const regularLoglevelArgsByPackageManager = {
  // Yarn doesn't have a loglevel flag
  yarn: [],
  pnpm: ['--loglevel', 'error'],
  npm: ['--loglevel', 'error'],
};

/** @type {Record<SupportedPackageManager, string[]>} */
const verboseLoglevelArgsByPackageManager = {
  yarn: ['--verbose'],
  pnpm: ['--loglevel', 'info'],
  npm: ['--loglevel', 'verbose'],
};

/**
 * @param {'verbose' | 'regular'} logLevel
 */
const resolveLogLevelArgs = (logLevel) => {
  if (logLevel === 'verbose') {
    return verboseLoglevelArgsByPackageManager[packageManager];
  }

  return regularLoglevelArgsByPackageManager[packageManager];
};

/**
 * @typedef {object} GetAddCommandOptions
 * @property {'dev' | 'prod'} type
 * @property {'verbose' | 'regular' | undefined} logLevel
 * @property {boolean} exact
 * @property {string[]} deps
 * @param {GetAddCommandOptions} options
 */
const getAddCommand = ({ type, logLevel, deps, exact }) => {
  const args = [];

  const addingDevDeps = type === 'dev';

  if (addingDevDeps) {
    const devDepFlag = isYarn ? '--dev' : `--save-dev`;
    args.push(devDepFlag);
  }

  if (exact) {
    const exactFlag = isYarn ? '--exact' : '--save-exact';
    args.push(exactFlag);
  }

  if (logLevel) {
    args.push(...resolveLogLevelArgs(logLevel));
  }

  args.push(...deps);

  return getCommand(packageManager, 'add', args);
};

const getInstallCommand = () => getCommand(packageManager, 'install', []);

const getWhyCommand = () => {
  const whyCommand = isPnpm ? '-r why' : 'why';

  return `${packageManager} ${whyCommand}`;
};

const getPackageManagerInstallPage = () => INSTALL_PAGE[packageManager];

module.exports = {
  supportedPackageManagers,
  rootDir,
  packageManager,
  isYarn,
  isPnpm,
  isNpm,
  getRunCommand,
  getExecuteCommand,
  getAddCommand,
  getInstallCommand,
  getWhyCommand,
  getPackageManagerInstallPage,
};
