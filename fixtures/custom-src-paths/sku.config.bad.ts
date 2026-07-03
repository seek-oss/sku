import type { SkuConfig } from 'sku';

import baseConfig from './sku.config';

export default {
  ...baseConfig,
  // purposefully missing another-folder to test error cases
  srcPaths: ['src'],
} satisfies SkuConfig;
