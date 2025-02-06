import { makeStableHashes } from '@sku-private/test-utils';

export default {
  publicPath: '/static/source-maps',
  port: 8303,
  target: 'dist',
  sourceMapsProd: true,
  dangerouslySetWebpackConfig: (config) => makeStableHashes(config),
};
