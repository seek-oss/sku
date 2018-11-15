const ListExternalsPlugin = require('../../../utils/ListExternalsWebpackPlugin');

module.exports = {
  publicPath: 'somecdn.com',
  dangerouslySetWebpackConfig: config => {
    if (config.name === 'render') {
      config.plugins.push(new ListExternalsPlugin());
    }

    return config;
  }
};
