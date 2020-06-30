const ListExternalsWebpackPlugin = require('../../../utils/ListExternalsWebpackPlugin');

module.exports = {
  port: 9843,
  serverPort: 9894,
  useHttpsDevServer: true,
  cspEnabled: true,
  cspExtraScriptSrcHosts: ['https://some-cdn.com'],
  dangerouslySetWebpackConfig: (config) => {
    if (config.name === 'render') {
      config.plugins.push(new ListExternalsWebpackPlugin());
    }

    return config;
  },
};
