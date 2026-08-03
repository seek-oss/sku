import {
  ListExternalsWebpackPlugin,
  makeStableHashes,
} from '@sku-private/test-utils';

export default {
  sites: [
    { name: 'seekAnz', host: 'au.seek.com.localhost' },
    { name: 'jobStreet', host: 'jobstreet.com.localhost' },
  ],
  publicPath: '/',
  port: 8200,
  dangerouslySetWebpackConfig: (config) => {
    if (config.name === 'render') {
      config.plugins.push(new ListExternalsWebpackPlugin());
    }

    makeStableHashes(config);

    return config;
  },
  setupTests: './jestSetup.js',
};
