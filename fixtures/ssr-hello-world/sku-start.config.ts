import { makeStableHashes } from '@sku-private/test-utils';
import type { SkuConfig } from 'sku';

export default {
  publicPath: 'http://localhost:4000',
  port: 8100,
  serverPort: 8101,
  target: 'dist-start',
  devServerMiddleware: './dev-middleware.cjs',
  cspEnabled: true,
  cspExtraScriptSrcHosts: ['https://some-cdn.com'],
  dangerouslySetWebpackConfig: (config) => makeStableHashes(config),
} satisfies SkuConfig;
