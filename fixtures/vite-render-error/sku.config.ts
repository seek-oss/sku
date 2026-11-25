import { makeStableViteHashes } from '@sku-private/test-utils';
import type { SkuConfig } from 'sku';

export default {
  dangerouslySetViteConfig: makeStableViteHashes,
  routes: [{ route: '/', name: 'home' }],
} satisfies SkuConfig;
