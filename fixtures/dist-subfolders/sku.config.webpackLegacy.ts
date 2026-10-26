import type { SkuConfig } from 'sku';

import baseConfig from './sku.config.webpack.ts';

export default {
  ...baseConfig,
  distSubfolders: false,
} satisfies SkuConfig;
