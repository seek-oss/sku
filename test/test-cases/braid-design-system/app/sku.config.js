const ListExternalsPlugin = require('../../../utils/ListExternalsWebpackPlugin');

module.exports = {
  sites: [{ name: 'seekAnz' }, { name: 'jobStreet' }],
  publicPath: '/',
  port: 8200,
  dangerouslySetWebpackConfig: (config) => {
    if (config.name === 'render') {
      config.plugins.push(new ListExternalsPlugin());
    }

    return config;
  },
};
