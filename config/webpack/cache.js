const { persistentCache, paths } = require('../../context');
const isCI = require('../../lib/isCI');

const disableCacheOverride = Boolean(process.env.SKU_DISABLE_CACHE);

module.exports = function getWebpackCacheSettings({ isDevServer }) {
  if (isDevServer && !isCI && !disableCacheOverride) {
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
