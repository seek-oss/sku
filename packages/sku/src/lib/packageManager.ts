import findUp from 'find-up';
import { dirname } from 'node:path';
import type { Command } from 'package-manager-detector';
import { resolveCommand } from 'package-manager-detector/commands';
import { INSTALL_PAGE } from 'package-manager-detector/constants';
import { getPackageManager } from '../context/packageManager.js';

type SupportedPackageManager = 'yarn' | 'pnpm' | 'npm';

const supportedPackageManagers = ['yarn', 'pnpm', 'npm'];

const validatePackageManager = (packageManager: string) => {
  if (!supportedPackageManagers.includes(packageManager)) {
    throw new Error(
      `Unsupported package manager: ${packageManager}. Supported package managers are: ${supportedPackageManagers.join(
        ', ',
      )}`,
    );
  }

  return packageManager as SupportedPackageManager;
};

const getPackageManagerFromUserAgent = () => {
  const userAgent = process.env.npm_config_user_agent || '';

  // Default to 'npm'
  let packageManager = 'npm';

  let version = null;
  if (userAgent) {
    // User agents typically look like `pnpm/9.12.1 npm/? node/v20.17.0 linux x64`
    version = userAgent.split(' ')?.[0].split('/')?.[1];
  }

  if (userAgent.includes('yarn')) {
    packageManager = 'yarn';
  }

  if (userAgent.includes('pnpm')) {
    packageManager = 'pnpm';
  }

  return { packageManager, version };
};

const lockfileByPackageManager: Record<SupportedPackageManager, string> = {
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
  const userAgentPackageManager = getPackageManagerFromUserAgent();
  const packageManager = validatePackageManager(
    getPackageManager() || userAgentPackageManager.packageManager,
  );

  const lockFile = lockfileByPackageManager[packageManager];
  const lockFilePath = findUp.sync(lockFile);

  // No root found (occurs during `sku init`), `rootDir` will be `null`
  const rootDir = lockFilePath ? dirname(lockFilePath) : null;

  return {
    packageManager,
    rootDir,
    packageManagerVersion: userAgentPackageManager.version,
  };
};

const { rootDir, packageManager, packageManagerVersion } =
  resolvePackageManager();

export { rootDir, packageManager, packageManagerVersion };

export const getCommand = (
  agent: SupportedPackageManager,
  command: Command,
  args: string[],
) => {
  const resolvedCommand = resolveCommand(agent, command, args);

  if (!resolvedCommand) {
    throw new Error(`Unable to resolve command: ${agent} ${command} ${args}`);
  }

  return `${resolvedCommand.command} ${resolvedCommand.args.join(' ')}`;
};

export const isYarn = packageManager === 'yarn';
export const isPnpm = packageManager === 'pnpm';
export const isNpm = packageManager === 'npm';

export const getRunCommand = (scriptName: string) =>
  getCommand(packageManager, 'run', [scriptName]);

export const getExecuteCommand = (args: string[]) =>
  getCommand(packageManager, 'execute', args);

const regularLoglevelArgsByPackageManager: Record<
  SupportedPackageManager,
  string[]
> = {
  // Yarn doesn't have a loglevel flag
  yarn: [],
  pnpm: ['--loglevel', 'error'],
  npm: ['--loglevel', 'error'],
};

const verboseLoglevelArgsByPackageManager: Record<
  SupportedPackageManager,
  string[]
> = {
  yarn: ['--verbose'],
  pnpm: ['--loglevel', 'info'],
  npm: ['--loglevel', 'verbose'],
};

const resolveLogLevelArgs = (logLevel: 'verbose' | 'regular') => {
  if (logLevel === 'verbose') {
    return verboseLoglevelArgsByPackageManager[packageManager];
  }

  return regularLoglevelArgsByPackageManager[packageManager];
};

export type GetAddCommandOptions = {
  type?: 'dev' | 'prod';
  logLevel?: 'verbose' | 'regular';
  exact?: boolean;
  deps: string[];
};

export const getAddCommand = ({
  type,
  logLevel,
  deps,
  exact,
}: GetAddCommandOptions) => {
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
