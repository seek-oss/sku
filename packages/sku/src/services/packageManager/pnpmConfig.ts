import exists from '@/utils/exists.js';
import chalk from 'chalk';
import path from 'node:path';

const accent = chalk.blue.bold;
const info = chalk.bold;

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
    console.log(`Detected ${accent('.npmrc')} file.`);
    console.log(
      `Please migrate all ${accent('.npmrc')} configuration to ${accent('pnpm-workspace.yaml')} and add ${accent('.npmrc')} to your ${accent('.gitignore')}. See ${info('https://pnpm.io/settings')} for more information.`,
    );
  }

  if (!pnpmPluginSkuInstalled || !hasRecommendedPnpmVersionInstalled) {
    console.log(
      `In order for sku to best manage your PNPM config, please update to PNPM v10.13.0 or later and then run "${accent('pnpm add --config pnpm-plugin-sku')}" and "${accent('pnpm install')}".`,
    );
  }
};
