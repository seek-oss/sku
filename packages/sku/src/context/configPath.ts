import { existsSync } from 'node:fs';
import { getPathFromCwd } from '@sku-private/utils';
import { createDebug } from 'obug';
import { caution, critical, link, strong } from '@sku-private/utils/console';

const debug = createDebug('sku:config');

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
    console.error(
      critical('Error:'),
      `Sku config file not found for path: ${caution(resolvedCustomConfigPath)}`,
    );
    console.error();
    console.error(
      `See ${link('https://seek-oss.github.io/sku/#/./docs/configuration')} for configuration help.`,
    );
    debug('Custom sku config file does not exist:', resolvedCustomConfigPath);
    process.exit(1);
  }

  const supportedSkuConfigPath = resolveSupportedSkuConfigPath();

  if (supportedSkuConfigPath) {
    debug('Loading sku config:', supportedSkuConfigPath);

    return supportedSkuConfigPath;
  }

  debug(
    `Failed to find a supported ${strong('sku.config')} file (supported formats are ${supportedSkuConfigExtensions.map((ext) => `sku.config.${ext}`).join(', ')})`,
  );

  return null;
};
