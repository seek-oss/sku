import banner from '../../utils/banners/banner.js';
import exists from '../../utils/exists.js';
import chalk from 'chalk';
import path from 'node:path';
import isCI from '../../utils/isCI.js';

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

  if (!isCI && npmrcExists) {
    banner('warning', 'Detected .npmrc file', [
      `Please migrate all ${accent('.npmrc')} configuration to ${accent('pnpm-workspace.yaml')} and add ${accent('.npmrc')} to your ${accent('.gitignore')}. See ${info('https://pnpm.io/settings')} for more information.`,
    ]);
  }

  if (!pnpmPluginSkuInstalled || !hasRecommendedPnpmVersionInstalled) {
    const messages: string[] = [];

    if (!hasRecommendedPnpmVersionInstalled) {
      messages.push(
        `Please ensure you are on ${accent('PNPM v10.13.0')} or later.`,
      );
    }

    messages.push(
      `Please delete your top-level ${accent('node_modules')} and run "${accent('pnpm add --config pnpm-plugin-sku && pnpm install')}".`,
    );

    banner('warning', 'pnpm-plugin-sku is not configured correctly', messages);
  }
};
