import { makeStableViteHashes } from '@sku-private/test-utils';
import type { SkuConfig } from 'sku';

export default {
  bundler: 'vite',
  dangerouslySetViteConfig: makeStableViteHashes,
} satisfies SkuConfig;
