// @ts-ignore
import { makeStableHashes } from '@sku-private/test-utils';
import type { SkuConfig } from 'sku';

export default {
  bundler: 'vite',
  clientEntry: 'src/client.jsx',
  renderEntry: 'src/render.jsx',
  serverEntry: 'src/server.jsx',
  publicPath: '/static/source-maps',
  port: 8303,
  target: 'dist',
  sourceMapsProd: true,
  dangerouslySetWebpackConfig: (config) => makeStableHashes(config),
} satisfies SkuConfig;
