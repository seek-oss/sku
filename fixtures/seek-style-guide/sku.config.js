const { ListExternalsWebpackPlugin } = require('@sku-private/test-utils');

module.exports = {
  dangerouslySetWebpackConfig: (config) => {
    if (config.name === 'render') {
      config.plugins.push(new ListExternalsWebpackPlugin());
    }

    return config;
  },
};
