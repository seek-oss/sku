export {
  rootDir,
  packageManager,
  packageManagerVersion,
  getCommand,
  isYarn,
  isPnpm,
  isNpm,
  getRunCommand,
  getExecuteCommand,
  getAddCommand,
  getInstallCommand,
  getWhyCommand,
  getPackageManagerInstallPage,
  type GetAddCommandOptions,
  type SupportedPackageManager,
} from './packageManager.ts';

export * from './pnpmWorkspaceDefaults.ts';
export * from './ensurePnpmWorkspaceConfig.ts';
