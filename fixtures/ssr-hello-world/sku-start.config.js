const { makeStableHashes } = require('@sku-private/test-utils');

module.exports = {
  publicPath: 'http://localhost:4000',
  port: 8100,
  serverPort: 8101,
  target: 'dist-start',
  devServerMiddleware: './dev-middleware.js',
  cspEnabled: true,
  cspExtraScriptSrcHosts: ['https://some-cdn.com'],
  dangerouslySetWebpackConfig: (config) => makeStableHashes(config),
};
