const { persistentCache, appSkuConfigPath } = require('../../context');

module.exports = function getWebpackCacheSettings({ isDevServer }) {
  if (isDevServer) {
    if (persistentCache) {
      return {
        type: 'filesystem',
        config: [appSkuConfigPath],
      };
    }

    return {
      type: 'memory',
    };
  }

  return false;
};
