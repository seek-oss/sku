import { makeStableViteHashes } from '@sku-private/test-utils';
import type { SkuConfig } from 'sku';

import defaultConfig from './sku.config.js';

export default {
  ...defaultConfig,
  bundler: 'vite',
  __UNSAFE_EXPERIMENTAL__dangerouslySetViteConfig: makeStableViteHashes,
} satisfies SkuConfig;
