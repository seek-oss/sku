import { makeStableHashes } from '@sku-private/test-utils';

export default {
  clientEntry: 'src/client.jsx',
  renderEntry: 'src/render.jsx',
  publicPath: '/static/my-app',
  port: 4001,
  dangerouslySetWebpackConfig: (config) => makeStableHashes(config),
};
