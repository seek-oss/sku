import isCI from '@/utils/isCI.js';
import type { SkuContext } from '@/context/createSkuContext.js';

const disableCacheOverride = Boolean(process.env.SKU_DISABLE_CACHE);

function getWebpackCacheSettings({
  isDevServer,
  paths,
}: {
  isDevServer: boolean;
  paths: SkuContext['paths'];
}) {
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
