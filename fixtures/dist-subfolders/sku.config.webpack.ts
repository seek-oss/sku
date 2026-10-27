import type { SkuConfig } from 'sku';

import baseConfig from './sku.config.ts';

export default {
  ...baseConfig,
  bundler: 'webpack',
  // Webpack doesn't support header CSP delivery
  cspDelivery: 'tag',
} satisfies SkuConfig;
