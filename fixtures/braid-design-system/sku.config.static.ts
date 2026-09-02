import { makeStableViteHashes } from '@sku-private/test-utils';
import type { SkuConfig } from 'sku';

import baseConfig from './sku.config.base.js';

export default {
  ...baseConfig,
  bundler: 'vite',

  entrySideEffects: ['braid-design-system/reset'],

  clientEntry: 'src/static/client.tsx',
  renderEntry: 'src/static/render.tsx',

  port: 8200,

  dangerouslySetViteConfig: makeStableViteHashes,
} satisfies SkuConfig;
