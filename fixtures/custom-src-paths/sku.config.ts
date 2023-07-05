import type { SkuConfig } from 'sku';

export default {
  srcPaths: ['lib', 'another-folder'],
  clientEntry: 'lib/client.js',
  renderEntry: 'lib/render.js',
  port: 8201,
  publicPath: '/some-static-place',
} satisfies SkuConfig;
