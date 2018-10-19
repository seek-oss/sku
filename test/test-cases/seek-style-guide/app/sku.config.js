const ListExternalsPlugin = require('../../../utils/ListExternalsWebpackPlugin');

module.exports = {
  entry: {
    client: 'src/client.js',
    render: 'src/render.js'
  },
  target: 'dist',
  dangerouslySetWebpackConfig: config => {
    if (config.name === 'render') {
      config.plugins.push(new ListExternalsPlugin());
    }

    return config;
  }
};
