import { makeStableViteHashes } from '@sku-private/test-utils';
import type { SkuConfig } from 'sku';

import baseConfig from './sku.config.ts';

export default {
  ...baseConfig,
  bundler: 'vite',
  dangerouslySetViteConfig: makeStableViteHashes,
} satisfies SkuConfig;
