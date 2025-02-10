import chalk from 'chalk';
import { existsSync } from 'node:fs';
import { getPathFromCwd } from '@/utils/cwd.js';

const supportedSkuConfigExtensions = ['ts', 'js', 'mjs'];

const resolveSupportedSkuConfigPath = () => {
  for (const extension of supportedSkuConfigExtensions) {
    const path = getPathFromCwd(`sku.config.${extension}`);

    if (existsSync(path)) {
      return path;
    }
  }

  return null;
};

export const resolveAppSkuConfigPath = ({
  configPath,
}: {
  configPath?: string;
}): string | null => {
  const customSkuConfigPath = configPath || process.env.SKU_CONFIG;

  if (customSkuConfigPath) {
    const resolvedCustomConfigPath = getPathFromCwd(customSkuConfigPath);

    if (existsSync(resolvedCustomConfigPath)) {
      console.log('Loading custom sku config:', resolvedCustomConfigPath);

      return resolvedCustomConfigPath;
    }

    console.warn(
      'Custom sku config file does not exist:',
      resolvedCustomConfigPath,
    );
  }

  const supportedSkuConfigPath = resolveSupportedSkuConfigPath();

  if (supportedSkuConfigPath) {
    console.log('Loading sku config:', supportedSkuConfigPath);

    return supportedSkuConfigPath;
  }

  console.warn(
    `Failed to find a supported ${chalk.bold('sku.config')} file (supported formats are ${supportedSkuConfigExtensions.map((ext) => `sku.config.${ext}`).join(', ')})`,
  );

  return null;
};
