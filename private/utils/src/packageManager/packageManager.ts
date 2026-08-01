import * as find from 'empathic/find';
import { dirname } from 'node:path';
import type { Agent, Command } from 'package-manager-detector';
import { resolveCommand } from 'package-manager-detector/commands';
import { AGENTS, INSTALL_PAGE } from 'package-manager-detector/constants';
import { detectSync } from 'package-manager-detector/detect';
import semver from 'semver';
import { caution, strong } from '../console/styles.ts';

// lockfiles should be ordered by priority, highest priority first.
const lockfileByPackageManager = {
  pnpm: 'pnpm-lock.yaml',
  yarn: 'yarn.lock',
  npm: 'package-lock.json',
} as const satisfies Record<string, string>;

export type SupportedPackageManager = keyof typeof lockfileByPackageManager;

const supportedPackageManagers = Object.keys(
  lockfileByPackageManager,
) as SupportedPackageManager[];

const isSupportedPackageManager = (
  packageManager: string | null | undefined,
): packageManager is SupportedPackageManager =>
  supportedPackageManagers.includes(packageManager as SupportedPackageManager);

/**
 * The package manager that invoked the current process, if any.
 * This is unset when sku is run without a package manager, e.g. `./node_modules/.bin/sku`.
 */
const getRunningPackageManager = () => {
  const userAgent = process.env.npm_config_user_agent;
  if (!userAgent) {
    return null;
  }

  // User agents typically look like `pnpm/9.12.1 npm/? node/v20.17.0 linux x64`
  const [agentPart] = userAgent.split(' ');
  const [name, version] = agentPart.split('/');

  if (!AGENTS.includes(name as Agent)) {
    return null;
  }

  return { name, version };
};

/**
 * The project's package manager, resolved from its `packageManager` field or lockfile.
 * This is unset when there is no project to detect, e.g. during `@sku-lib/create`.
 */
const getProjectPackageManager = () => {
  const detected = detectSync();

  if (!detected) {
    return null;
  }

  const { name, version = null } = detected;

  return { name, version };
};

const getFallbackPackageManager = (): SupportedPackageManager => {
  const fallback = 'npm';
  console.warn(
    caution(`No package manager detected, assuming ${strong(fallback)}`),
  );
  return fallback;
};

const resolveDetectedPackageManager = () => {
  const projectPackageManager = getProjectPackageManager();
  const runningPackageManager = getRunningPackageManager();

  const name =
    projectPackageManager?.name ??
    runningPackageManager?.name ??
    getFallbackPackageManager(); // some edge cases might use this fallback, but unlikely

  if (!isSupportedPackageManager(name)) {
    throw new Error(
      `Unsupported package manager: ${name}. Supported package managers are: ${supportedPackageManagers.join(
        ', ',
      )}`,
    );
  }

  const isRunningResolvedPackageManager = runningPackageManager?.name === name;

  if (
    projectPackageManager &&
    runningPackageManager &&
    !isRunningResolvedPackageManager
  ) {
    console.warn(
      caution(
        `Package manager mismatch: sku was run with ${strong(runningPackageManager.name)}, but this project uses ${strong(name)}`,
      ),
    );
  }

  // The running version is the most accurate source of the version, so we use it if it's available.
  const version =
    (isRunningResolvedPackageManager ? runningPackageManager.version : null) ??
    projectPackageManager?.version ??
    null;

  return { name, version };
};

/**
 * Get the package manager and root directory of the project.
 */
const resolvePackageManager = () => {
  const lockfilePath = find.any(Object.values(lockfileByPackageManager));

  // No lockfile can be found during `@sku-lib/create`.
  const rootDir = lockfilePath ? dirname(lockfilePath) : null;

  const { name, version } = resolveDetectedPackageManager();

  return {
    packageManager: name,
    rootDir,
    packageManagerVersion: version,
  };
};

const { rootDir, packageManager, packageManagerVersion } =
  resolvePackageManager();

export { rootDir, packageManager, packageManagerVersion };

export const isAtLeastPnpmV10 = () =>
  packageManager === 'pnpm' &&
  packageManagerVersion &&
  semver.satisfies(packageManagerVersion, '>=10.0.0');

const recommendedPnpmVersion = '10.13.0';
export const isAtLeastRecommendedPnpmVersion = () =>
  Boolean(
    packageManager === 'pnpm' &&
    packageManagerVersion &&
    semver.satisfies(packageManagerVersion, `>=${recommendedPnpmVersion}`),
  );

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
