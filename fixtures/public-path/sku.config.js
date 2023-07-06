import { makeStableHashes } from '@sku-private/test-utils';

export default {
  publicPath: '/static',
  target: 'dist/static',
  port: 4001,
  dangerouslySetWebpackConfig: (config) => makeStableHashes(config),
};
