import type { SkuConfig } from 'sku';
// @ts-expect-error no types
import { makeStableHashes } from '@sku-private/test-utils';

export default {
  clientEntry: 'src/client.tsx',
  renderEntry: 'src/render.tsx',
  port: 8205,
  storybookPort: 8090,
  publicPath: '/styling',
  target: 'dist',
  dangerouslySetWebpackConfig: (config) => makeStableHashes(config),
} satisfies SkuConfig;
