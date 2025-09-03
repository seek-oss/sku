import { banner } from '@sku-lib/utils';
import chalk from 'chalk';

const accent = chalk.blue.bold;

export const validatePnpmConfig = async ({
  hasRecommendedPnpmVersionInstalled,
  pnpmPluginSkuInstalled,
}: {
  hasRecommendedPnpmVersionInstalled: boolean;
  pnpmPluginSkuInstalled: boolean;
}) => {
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
