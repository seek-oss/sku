import { makeStableHashes } from '@sku-private/test-utils';
import type { SkuConfig } from 'sku';

export default {
  srcPaths: ['lib', 'another-folder'],
  clientEntry: 'lib/client.jsx',
  renderEntry: 'lib/render.jsx',
  port: 8201,
  publicPath: '/some-static-place',
  dangerouslySetWebpackConfig: (config) => makeStableHashes(config),
} satisfies SkuConfig;
