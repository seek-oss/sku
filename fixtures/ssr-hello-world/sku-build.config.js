const { makeStableHashes } = require('@sku-private/test-utils');

module.exports = {
  publicPath: 'http://localhost:4000',
  port: 8000,
  serverPort: 8001,
  target: 'dist-build',
  public: 'assets',
  cspEnabled: true,
  cspExtraScriptSrcHosts: ['https://some-cdn.com'],
  dangerouslySetWebpackConfig: (config) => makeStableHashes(config),
};
