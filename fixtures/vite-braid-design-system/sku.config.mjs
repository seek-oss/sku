import {
  ListExternalsWebpackPlugin,
  makeStableHashes,
} from '@sku-private/test-utils';

export default {
  clientEntry: './src/client.jsx',
  renderEntry: './src/render.jsx',
  serverEntry: './src/server.jsx',
  bundler: 'vite',
  sites: [
    { name: 'seekAnz', host: 'dev.seek.com.au' },
    { name: 'jobStreet', host: 'dev.jobstreet.com' },
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
