const { persistentCache, paths } = require('../../context');
const isCI = require('../../lib/isCI');

module.exports = function getWebpackCacheSettings({ isDevServer }) {
  if (isDevServer && !isCI) {
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
