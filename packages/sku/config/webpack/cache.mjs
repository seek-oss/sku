import { paths } from '../../context';
import isCI from '../../lib/isCI';

const disableCacheOverride = Boolean(process.env.SKU_DISABLE_CACHE);

function getWebpackCacheSettings({ isDevServer }) {
  if (isDevServer && !isCI && !disableCacheOverride) {
    return {
      type: 'filesystem',
      buildDependencies: {
        config: paths.appSkuConfigPath ? [paths.appSkuConfigPath] : [],
      },
    };
  }

  return false;
}

export default getWebpackCacheSettings;
