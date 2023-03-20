const ListExternalsPlugin = require('../../test/utils/ListExternalsWebpackPlugin');

module.exports = {
  storybookPort: 8083,
  dangerouslySetWebpackConfig: (config) => {
    if (config.name === 'render') {
      config.plugins.push(new ListExternalsPlugin());
    }

    return config;
  },
};
