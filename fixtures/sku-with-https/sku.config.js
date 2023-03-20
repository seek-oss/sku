const { ListExternalsWebpackPlugin } = require('@sku-private/test-utils');

module.exports = {
  port: 9843,
  httpsDevServer: true,
  devServerMiddleware: './dev-middleware.js',
  cspEnabled: true,
  cspExtraScriptSrcHosts: ['https://some-cdn.com'],
  dangerouslySetWebpackConfig: (config) => {
    if (config.name === 'render') {
      config.plugins.push(new ListExternalsWebpackPlugin());
    }

    return config;
  },
};
