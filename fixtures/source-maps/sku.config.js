const { makeStableHashes } = require('@sku-private/test-utils');

module.exports = {
  publicPath: '/static/source-maps',
  port: 8303,
  target: 'dist',
  sourceMapsProd: true,
  dangerouslySetWebpackConfig: (config) => makeStableHashes(config),
};
