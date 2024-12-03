// @ts-check
import findUp from 'find-up';
import { dirname } from 'node:path';
import { resolveCommand } from 'package-manager-detector/commands';
import { INSTALL_PAGE } from 'package-manager-detector/constants';
import { getPackageManager } from '../context/packageManager';

/** @typedef {'yarn' | 'pnpm' | 'npm'} SupportedPackageManager */

const supportedPackageManagers = ['yarn', 'pnpm', 'npm'];

/**
 * @param {string} packageManager
 * @returns {SupportedPackageManager}
 */
const validatePackageManager = (packageManager) => {
  if (!supportedPackageManagers.includes(packageManager)) {
    throw new Error(
      `Unsupported package manager: ${packageManager}. Supported package managers are: ${supportedPackageManagers.join(
        ', ',
      )}`,
    );
  }

  return /** @type {SupportedPackageManager} */ (packageManager);
};

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
const resolvePackageManager = () => {
  const packageManager = validatePackageManager(
    getPackageManager() || getPackageManagerFromUserAgent(),
  );

  const lockFile = lockfileByPackageManager[packageManager];
  const lockFilePath = findUp.sync(lockFile);

  // No root found (occurs during `sku init`), `rootDir` will be `null`
  /** @type {string | null} */
  const rootDir = lockFilePath ? dirname(lockFilePath) : null;

  return { packageManager, rootDir };
};

const { rootDir, packageManager } = resolvePackageManager();

export { rootDir, packageManager };

/**
 * @param {SupportedPackageManager} agent
 * @param {import("package-manager-detector").Command} command
 * @param {string[]} args
 */
export const getCommand = (agent, command, args) => {
  const resolvedCommand = resolveCommand(agent, command, args);

  if (!resolvedCommand) {
    throw new Error(`Unable to resolve command: ${agent} ${command} ${args}`);
  }

  return `${resolvedCommand.command} ${resolvedCommand.args.join(' ')}`;
};

export const isYarn = packageManager === 'yarn';
export const isPnpm = packageManager === 'pnpm';
export const isNpm = packageManager === 'npm';

/**
 * @param {string} scriptName
 */
export const getRunCommand = (scriptName) =>
  getCommand(packageManager, 'run', [scriptName]);

/**
 * @param {string[]} args
 */
export const getExecuteCommand = (args) =>
  getCommand(packageManager, 'execute', args);

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
export const getAddCommand = ({ type, logLevel, deps, exact }) => {
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

export const getInstallCommand = () =>
  getCommand(packageManager, 'install', []);

export const getWhyCommand = () => {
  const whyCommand = isPnpm ? 'why -r' : 'why';

  return `${packageManager} ${whyCommand}`;
};

export const getPackageManagerInstallPage = () => INSTALL_PAGE[packageManager];
