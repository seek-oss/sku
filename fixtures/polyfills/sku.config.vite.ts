import type { SkuConfig } from 'sku';

import baseConfig from './sku.config.js';

export default {
  ...baseConfig,
  __UNSAFE_EXPERIMENTAL__bundler: 'vite',
} satisfies SkuConfig;
