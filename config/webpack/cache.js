const { persistentCache } = require('../../context');

module.exports = function getWebpackCacheSettings({ isDevServer }) {
  if (isDevServer) {
    if (persistentCache) {
      return {
        type: 'filesystem',
      };
    }

    return {
      type: 'memory',
    };
  }

  return false;
};
