import type { SkuConfig } from 'sku';
// @ts-ignore no types
import { makeStableHashes } from '@sku-private/test-utils';

export default {
  clientEntry: 'src/client.tsx',
  renderEntry: 'src/render.tsx',
  port: 8205,
  publicPath: '/static/styling',
  target: 'dist',
  dangerouslySetWebpackConfig: (config) => makeStableHashes(config),
} satisfies SkuConfig;
