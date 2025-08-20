import { findUpSync } from 'find-up';
import { dirname } from 'node:path';
import semver from 'semver';

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

  let packageManager = 'npm';
  let version = null;

  if (userAgent) {
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

const resolvePackageManager = () => {
  const userAgentPackageManager = getPackageManagerFromUserAgent();
  const packageManager = validatePackageManager(
    userAgentPackageManager.packageManager,
  );

  const lockFile = lockfileByPackageManager[packageManager];
  const lockFilePath = findUpSync(lockFile);

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

export const isAtLeastPnpmV10 = () =>
  packageManager === 'pnpm' &&
  packageManagerVersion &&
  semver.satisfies(packageManagerVersion, '>=10.0.0');

export const getRunCommand = (script: string) => {
  switch (packageManager) {
    case 'yarn':
      return `yarn ${script}`;
    case 'pnpm':
      return `pnpm run ${script}`;
    case 'npm':
    default:
      return `npm run ${script}`;
  }
};

export const getInstallCommand = () => {
  switch (packageManager) {
    case 'yarn':
      return 'yarn';
    case 'pnpm':
      return 'pnpm install';
    case 'npm':
    default:
      return 'npm install';
  }
};

export const getPackageManagerInstallPage = () => {
  switch (packageManager) {
    case 'yarn':
      return 'https://yarnpkg.com/getting-started/install';
    case 'pnpm':
      return 'https://pnpm.io/installation';
    case 'npm':
    default:
      return 'https://docs.npmjs.com/downloading-and-installing-node-js-and-npm';
  }
};
