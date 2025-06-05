import chalk from 'chalk';
import { existsSync } from 'node:fs';
import { getPathFromCwd } from '@/utils/cwd.js';
import _debug from 'debug';

const debug = _debug('sku:config');

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
      debug('Loading custom sku config:', resolvedCustomConfigPath);

      return resolvedCustomConfigPath;
    }

    throw new Error(
      `No sku config file found for path: ${configPath}. Make sure the path is correct or that you have a sku.config.ts file in your project root.`,
    );
  }

  const supportedSkuConfigPath = resolveSupportedSkuConfigPath();

  if (supportedSkuConfigPath) {
    debug('Loading sku config:', supportedSkuConfigPath);

    return supportedSkuConfigPath;
  }

  debug(
    `Failed to find a supported ${chalk.bold('sku.config')} file (supported formats are ${supportedSkuConfigExtensions.map((ext) => `sku.config.${ext}`).join(', ')})`,
  );

  return null;
};
