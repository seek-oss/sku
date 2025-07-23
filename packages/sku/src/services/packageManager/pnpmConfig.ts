import exists from '@/utils/exists.js';
import chalk from 'chalk';
import path from 'node:path';

export const validatePnpmConfig = async ({
  rootDir,
  hasRecommendedPnpmVersionInstalled,
  pnpmPluginSkuInstalled,
}: {
  rootDir: string;
  hasRecommendedPnpmVersionInstalled: boolean;
  pnpmPluginSkuInstalled: boolean;
}) => {
  const npmrcExists = await exists(path.join(rootDir, '.npmrc'));

  if (npmrcExists) {
    console.log("Detected '.npmrc' file.");
    console.log(
      `Please migrate all ${chalk.blue.bold('.npmrc')} configuration to ${chalk.blue.bold('pnpm-workspace.yaml')} and add ${chalk.blue.bold('.npmrc')} to your ${chalk.blue.bold('.gitignore')}. See ${chalk.bold('https://pnpm.io/settings')} for more information.`,
    );
  }

  if (!pnpmPluginSkuInstalled || !hasRecommendedPnpmVersionInstalled) {
    console.log(
      `In order for sku to best manage your PNPM config, please update to PNPM v10.13.0 or later and then run "${chalk.blue.bold('pnpm add --config pnpm-plugin-sku')}" and "${chalk.blue.bold('pnpm install')}".`,
    );
  }
};
