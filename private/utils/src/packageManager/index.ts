export { getPackageManager, setPackageManager } from './context.js';
export {
  rootDir,
  packageManager,
  packageManagerVersion,
  isAtLeastPnpmV10,
  isAtLeastRecommendedPnpmVersion,
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
} from './packageManager.js';
