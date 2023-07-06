import type { SkuConfig } from 'sku';
// @ts-ignore no types
import { makeStableHashes } from '@sku-private/test-utils';

export default {
  srcPaths: ['lib', 'another-folder'],
  clientEntry: 'lib/client.js',
  renderEntry: 'lib/render.js',
  port: 8201,
  publicPath: '/some-static-place',
  dangerouslySetWebpackConfig: (config) => makeStableHashes(config),
} satisfies SkuConfig;
