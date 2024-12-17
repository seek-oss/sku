import { paths } from '../../context/index.js';
import isCI from '../../lib/isCI.js';

const disableCacheOverride = Boolean(process.env.SKU_DISABLE_CACHE);

function getWebpackCacheSettings({ isDevServer }: { isDevServer: boolean }) {
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
