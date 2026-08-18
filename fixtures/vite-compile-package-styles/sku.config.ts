import { makeStableViteHashes } from '@sku-private/test-utils';
import type { SkuConfig } from 'sku';

export default {
  bundler: 'vite',
  compilePackages: ['@sku-fixtures/package-with-vanilla-extract-source'],
  dangerouslySetViteConfig: makeStableViteHashes,
} satisfies SkuConfig;
