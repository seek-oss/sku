import { makeStableViteHashes } from '@sku-private/test-utils';
import type { SkuConfig } from 'sku';

import skuConfig from './sku.config.ts';

export default {
  ...skuConfig,
  __UNSAFE_EXPERIMENTAL__bundler: 'vite',
  __UNSAFE_EXPERIMENTAL__dangerouslySetViteConfig: makeStableViteHashes,
} satisfies SkuConfig;
