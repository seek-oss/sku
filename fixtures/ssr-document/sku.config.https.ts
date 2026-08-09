import type { SkuConfig } from 'sku';

import baseSkuConfig from './sku.config.js';

export default {
  ...baseSkuConfig,
  port: 8202,
  httpsDevServer: true,
} satisfies SkuConfig;
