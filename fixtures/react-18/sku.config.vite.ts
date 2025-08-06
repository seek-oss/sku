import type { SkuConfig } from 'sku';

import baseConfig from './sku.config';

export default {
  ...baseConfig,
  __UNSAFE_EXPERIMENTAL__bundler: 'vite',
} satisfies SkuConfig;
