import { makeStableHashes } from '@sku-private/test-utils';

export default {
  publicPath: 'http://localhost:4000',
  port: 8000,
  serverPort: 8001,
  target: 'dist-build',
  public: 'assets',
  cspEnabled: true,
  cspExtraScriptSrcHosts: ['https://some-cdn.com'],
  dangerouslySetWebpackConfig: (config) => makeStableHashes(config),
};
