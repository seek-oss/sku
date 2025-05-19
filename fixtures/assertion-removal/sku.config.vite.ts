import type { SkuConfig } from 'sku';

import baseConfig from './sku.config.ts';

export default {
  __UNSAFE_EXPERIMENTAL__bundler: 'vite',
  ...baseConfig,
} satisfies SkuConfig;
