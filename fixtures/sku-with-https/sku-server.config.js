const {
  ListExternalsWebpackPlugin,
  makeStableHashes,
} = require('@sku-private/test-utils');

module.exports = {
  clientEntry: 'src/serverClient.js',
  port: 9843,
  serverPort: 9894,
  httpsDevServer: true,
  devServerMiddleware: './dev-middleware.js',
  cspEnabled: true,
  cspExtraScriptSrcHosts: ['https://some-cdn.com'],
  dangerouslySetWebpackConfig: (config) => {
    if (config.name === 'render') {
      config.plugins.push(new ListExternalsWebpackPlugin());
    }

    makeStableHashes(config);

    return config;
  },
};
