const ListExternalsWebpackPlugin = require('../../../utils/ListExternalsWebpackPlugin');

module.exports = {
  port: 9843,
  serverPort: 9894,
  useHttpsDevServer: true,
  devServerMiddleware: (app) => {
    app.get('/test-middleware', (_, res) => {
      res.status(200).send('OK');
    });
  },
  target: 'dist-build',
  cspEnabled: true,
  cspExtraScriptSrcHosts: ['https://some-cdn.com'],
  dangerouslySetWebpackConfig: (config) => {
    if (config.name === 'render') {
      config.plugins.push(new ListExternalsWebpackPlugin());
    }

    return config;
  },
};
