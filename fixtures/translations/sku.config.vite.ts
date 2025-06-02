import type { SkuConfig } from 'sku';

import defaultConfig from './sku.config.js';

export default {
  ...defaultConfig,
  __UNSAFE_EXPERIMENTAL__bundler: 'vite',
} satisfies SkuConfig;
