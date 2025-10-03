import { makeStableViteHashes } from '@sku-private/test-utils';
import type { SkuConfig } from 'sku';

import skuConfig from './sku.config.ts';

export default {
  ...skuConfig,
  bundler: 'vite',
  dangerouslySetViteConfig: makeStableViteHashes,
} satisfies SkuConfig;
