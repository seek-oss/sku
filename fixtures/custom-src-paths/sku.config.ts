import { makeStableHashes } from '@sku-private/test-utils';
import type { SkuConfig } from 'sku';

export default {
  bundler: 'webpack',
  srcPaths: ['src', 'another-folder'],
  clientEntry: 'src/client.tsx',
  renderEntry: 'src/render.tsx',
  port: 8201,
  publicPath: '/some-static-place',
  dangerouslySetWebpackConfig: (config) => makeStableHashes(config),
} satisfies SkuConfig;
