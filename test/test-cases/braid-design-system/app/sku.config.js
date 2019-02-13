const ListExternalsPlugin = require('../../../utils/ListExternalsWebpackPlugin');

module.exports = {
  sites: [
    { name: 'seekAnz', host: 'dev.seek.com.au' },
    { name: 'jobStreet', host: 'dev.jobstreet.com' }
  ],
  publicPath: 'https://somecdn.com',
  port: 8200,
  dangerouslySetWebpackConfig: config => {
    if (config.name === 'render') {
      config.plugins.push(new ListExternalsPlugin());
    }

    return config;
  }
};
