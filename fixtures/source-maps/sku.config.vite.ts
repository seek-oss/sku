import type { SkuConfig } from 'sku';

import skuConfig from './sku.config.ts';

export default {
  __UNSAFE_EXPERIMENTAL__bundler: 'vite',
  ...skuConfig,
} satisfies SkuConfig;
