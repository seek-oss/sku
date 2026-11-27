import type { SkuConfig } from 'sku';

import baseConfig from './sku.config.ts';

export default {
  ...baseConfig,
  bundler: 'webpack',
} satisfies SkuConfig;
