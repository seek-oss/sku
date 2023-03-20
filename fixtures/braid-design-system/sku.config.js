const { ListExternalsWebpackPlugin } = require('@sku-private/test-utils');

module.exports = {
  sites: [
    { name: 'seekAnz', host: 'dev.seek.com.au' },
    { name: 'jobStreet', host: 'dev.jobstreet.com' },
  ],
  publicPath: '/',
  port: 8200,
  persistentCache: false,
  dangerouslySetWebpackConfig: (config) => {
    if (config.name === 'render') {
      config.plugins.push(new ListExternalsWebpackPlugin());
    }

    // Addresses an issue with this specific test suite where module IDs
    // were different between local dev and CI
    config.optimization.moduleIds = 'named';

    return config;
  },
};
