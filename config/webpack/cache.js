const { persistentCache, paths } = require('../../context');

module.exports = function getWebpackCacheSettings({ isDevServer }) {
  if (isDevServer) {
    if (persistentCache) {
      return {
        type: 'filesystem',
        buildDependencies: {
          config: [paths.appSkuConfigPath],
        },
      };
    }

    return {
      type: 'memory',
    };
  }

  return false;
};
