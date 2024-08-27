// @ts-check
const findUp = require('find-up');
const path = require('node:path');
const {
  resolveCommand,
  // eslint-plugin import can't resolve subpath imports inside js files
  // eslint-disable-next-line import/no-unresolved
} = require('package-manager-detector/commands');
const {
  INSTALL_PAGE,
  // eslint-plugin import can't resolve subpath imports inside js files
  // eslint-disable-next-line import/no-unresolved
} = require('package-manager-detector/constants');

const skuArgs = require('../config/args');

/** @typedef {'yarn' | 'pnpm' | 'npm'} SupportedPackageManager */

const getPackageManagerFromUserAgent = () => {
  const userAgent = process.env.npm_config_user_agent || '';

  if (userAgent.includes('yarn')) {
    return 'yarn';
  }

  if (userAgent.includes('pnpm')) {
    return 'pnpm';
  }

  return 'npm';
};

/** @type {Record<SupportedPackageManager, string>} */
const lockfileByPackageManager = {
  yarn: 'yarn.lock',
  pnpm: 'pnpm-lock.yaml',
  npm: 'package-lock.json',
};

/**
 * Get the package manager and root directory of the project. The package manager is derived from
 * the `packageManager` CLI argument if present, falling back to the `npm_config_user_agent` envar.
 * If the project does not have a root directory, `rootDir` will be `null`.
 */
const getPackageManager = () => {
  /** @type {SupportedPackageManager} */
  const packageManager =
    // @ts-expect-error skuArgs is missing the arguments parsed by minimist
    skuArgs?.packageManager || getPackageManagerFromUserAgent();

  const lockFile = lockfileByPackageManager[packageManager];
  const lockFilePath = findUp.sync(lockFile);

  // No root found (occurs during `sku init`), `rootDir` will be `null`
  /** @type {string | null} */
  const rootDir = lockFilePath ? path.dirname(lockFilePath) : null;

  return { packageManager, rootDir };
};

const { rootDir, packageManager } = getPackageManager();

/**
 * @param {SupportedPackageManager} agent
 * @param {import("package-manager-detector").Command} command
 * @param {string[]} args
 */
const getCommand = (agent, command, args) => {
  const resolvedCommand = resolveCommand(agent, command, args);

  if (!resolvedCommand) {
    throw new Error(`Unable to resolve command: ${agent} ${command} ${args}`);
  }

  return `${resolvedCommand.command} ${resolvedCommand.args.join(' ')}`;
};

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
  const whyCommand = isPnpm ? 'why -r' : 'why';

  return `${packageManager} ${whyCommand}`;
};

const getPackageManagerInstallPage = () => INSTALL_PAGE[packageManager];

module.exports = {
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
