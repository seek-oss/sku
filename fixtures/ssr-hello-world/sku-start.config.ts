import { makeStableHashes } from '@sku-private/test-utils';
import type { SkuConfig } from 'sku';

export default {
  port: 8100,
  serverPort: 8101,
  target: 'dist-start',
  devServerMiddleware: './dev-middleware.cjs',
  cspEnabled: true,
  cspExtraScriptSrcHosts: ['https://some-cdn.com'],
  dangerouslySetWebpackConfig: (config) => makeStableHashes(config),
  publicPath: '/static/ssr-hello-world',
} satisfies SkuConfig;
