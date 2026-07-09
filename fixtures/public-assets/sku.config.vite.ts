import { makeStableViteHashes } from '@sku-private/test-utils';
import type { SkuConfig } from 'sku';

import baseConfig from './sku.config.ts';

export default {
  ...baseConfig,
  clientEntry: 'src/viteClient.tsx',
  renderEntry: 'src/viteRender.tsx',
  bundler: 'vite',
  dangerouslySetViteConfig: makeStableViteHashes,
} satisfies SkuConfig;
