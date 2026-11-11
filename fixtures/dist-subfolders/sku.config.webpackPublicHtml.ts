import type { SkuConfig } from 'sku';

import baseConfig from './sku.config.webpack.ts';

export default {
  ...baseConfig,
  public: 'public-html',
} satisfies SkuConfig;
