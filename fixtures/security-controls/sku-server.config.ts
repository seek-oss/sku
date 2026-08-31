import {
  ListExternalsWebpackPlugin,
  makeStableHashes,
} from '@sku-private/test-utils';

export default {
  port: 9847,
  // Required for the test to serve client assets from http-server.
  publicPath: 'http://localhost:9848',
  clientEntry: './src/serverClient.jsx',
  renderEntry: './src/render.jsx',
  serverEntry: './src/server.jsx',
  cspEnabled: true,
  cspExtraScriptSrcHosts: ['https://some-cdn.com'],
  dangerouslySetWebpackConfig: (config) => {
    if (config.name === 'render') {
      config.plugins.push(new ListExternalsWebpackPlugin());
    }

    makeStableHashes(config);

    return config;
  },
};
