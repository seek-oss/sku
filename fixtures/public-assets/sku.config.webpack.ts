import { makeStableHashes } from '@sku-private/test-utils';
import type { SkuConfig } from 'sku';

import baseConfig from './sku.config.ts';

export default {
  ...baseConfig,
  bundler: 'webpack',
  clientEntry: 'src/client.tsx',
  renderEntry: 'src/render.tsx',
  dangerouslySetWebpackConfig: (config) => makeStableHashes(config),
} satisfies SkuConfig;
