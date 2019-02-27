const ListExternalsPlugin = require('../../../utils/ListExternalsWebpackPlugin');

module.exports = {
  port: 8203,
  dangerouslySetWebpackConfig: config => {
    if (config.name === 'render') {
      config.plugins.push(new ListExternalsPlugin());
    }

    return config;
  },
};
