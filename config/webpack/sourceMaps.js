const { sourceMapsProd } = require('../../context');

module.exports = function getSourceMapSetting({ isDevServer }) {
  if (isDevServer) {
    return 'eval-cheap-module-source-map';
  }

  return sourceMapsProd ? 'source-map' : false;
};
