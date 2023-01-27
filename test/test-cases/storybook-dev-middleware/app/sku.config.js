const ListExternalsWebpackPlugin = require('../../../utils/ListExternalsWebpackPlugin');

module.exports = {
  devServerMiddleware: './dev-middleware.js',
  dangerouslySetWebpackConfig: (config) => {
    if (config.name === 'render') {
      config.plugins.push(new ListExternalsWebpackPlugin());
    }

    return config;
  },
};
