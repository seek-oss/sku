const { ListExternalsWebpackPlugin } = require('@sku-private/test-utils');

module.exports = {
  storybookPort: 8083,
  dangerouslySetWebpackConfig: (config) => {
    if (config.name === 'render') {
      config.plugins.push(new ListExternalsWebpackPlugin());
    }

    return config;
  },
};
