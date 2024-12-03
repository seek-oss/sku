import { sourceMapsProd } from '../../context';

function getSourceMapSetting({ isDevServer }) {
  if (isDevServer) {
    return 'eval-cheap-module-source-map';
  }

  return sourceMapsProd ? 'source-map' : false;
}

export default getSourceMapSetting;
