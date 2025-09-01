import { makeStableHashes } from '@sku-private/test-utils';
import type { SkuConfig } from 'sku';

export default {
  publicPath: 'http://localhost:4000',
  port: 8000,
  serverPort: 8001,
  target: 'dist-build',
  public: 'assets',
  cspEnabled: true,
  cspExtraScriptSrcHosts: ['https://some-cdn.com'],
  devServerAsEntry: true,
  dangerouslySetWebpackConfig: (config) => makeStableHashes(config),
} satisfies SkuConfig;
