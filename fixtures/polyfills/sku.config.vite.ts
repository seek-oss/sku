import { makeStableViteHashes } from '@sku-private/test-utils';
import type { SkuConfig } from 'sku';

import baseConfig from './sku.config.js';

export default {
  ...baseConfig,
  __UNSAFE_EXPERIMENTAL__bundler: 'vite',
  __UNSAFE_EXPERIMENTAL__dangerouslySetViteConfig: makeStableViteHashes,
} satisfies SkuConfig;
