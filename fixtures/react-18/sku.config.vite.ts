import { makeStableViteHashes } from '@sku-private/test-utils';
import type { SkuConfig } from 'sku';

import baseConfig from './sku.config';

export default {
  ...baseConfig,
  bundler: 'vite',
  __UNSAFE_EXPERIMENTAL__dangerouslySetViteConfig: makeStableViteHashes,
} satisfies SkuConfig;
