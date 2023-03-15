const ListExternalsPlugin = require('../../test/utils/ListExternalsWebpackPlugin');

module.exports = {
  dangerouslySetWebpackConfig: (config) => {
    if (config.name === 'render') {
      config.plugins.push(new ListExternalsPlugin());
    }

    return config;
  },
};
