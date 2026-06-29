import { readFileSync } from 'node:fs';

import { banner, accent } from '@sku-private/utils/console';

/**
 * Matches a reference to the CommonJS `module.exports` anywhere in the file.
 * `module` is a restricted word in ESM, so `module.exports` should never
 * legitimately appear in an ESM config, making an anywhere-in-file match safe.
 */
const cjsExportsPattern = /module\.exports\b/;

/**
 * Returns `true` when the provided sku config source uses the unsupported
 * CommonJS `module.exports` format rather than an ESM `export default`.
 */
export const isCjsSkuConfig = (source: string): boolean =>
  cjsExportsPattern.test(source);

/**
 * Validates that the user's sku config uses the supported ESM format. If the
 * config uses the CommonJS `module.exports` format, a banner is shown and the
 * process exits.
 */
export const validateSkuConfigFormat = (appSkuConfigPath?: string) => {
  if (!appSkuConfigPath) {
    return;
  }

  const source = readFileSync(appSkuConfigPath, 'utf-8');

  if (isCjsSkuConfig(source)) {
    banner('critical', 'Unsupported sku config format', [
      `Your sku config (${accent(appSkuConfigPath)}) uses the CommonJS ${accent(
        'module.exports',
      )} format, which is not supported.`,
      `Please convert your config to ESM using ${accent('export default')}.`,
    ]);

    process.exit(1);
  }
};
