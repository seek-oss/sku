import { sourceMapsProd } from '../../context/index.js';

function getSourceMapSetting({ isDevServer }) {
  if (isDevServer) {
    return 'eval-cheap-module-source-map';
  }

  return sourceMapsProd ? 'source-map' : false;
}

export default getSourceMapSetting;
