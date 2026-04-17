import { createRequire } from 'node:module';

import isCI from '../../../utils/isCI.js';
import type { SkuContext } from '../../../context/createSkuContext.js';
import type { WebpackFilesystemCacheOptions } from '../../../types/types.js';

const require = createRequire(import.meta.url);

const disableCacheOverride = Boolean(process.env.SKU_DISABLE_CACHE);

function getWebpackCacheSettings({
  isDevServer,
  paths,
  webpackFilesystemCache,
}: {
  isDevServer: boolean;
  paths: SkuContext['paths'];
  webpackFilesystemCache: WebpackFilesystemCacheOptions;
}) {
  if (disableCacheOverride) {
    return false;
  }

  const {
    mode = 'development',
    compression,
    maxAge,
    buildDependencies = [],
  } = webpackFilesystemCache;

  const cacheEnabled = mode === 'always' || (isDevServer && !isCI);
  if (!cacheEnabled) {
    return false;
  }

  // Always invalidate on the user's sku config and on the installed sku version.
  const skuPackageJsonPath = require.resolve('sku/package.json');
  const defaultBuildDependencies = [
    paths.appSkuConfigPath,
    skuPackageJsonPath,
  ].filter((entry): entry is string => Boolean(entry));

  return {
    type: 'filesystem' as const,
    ...(compression !== undefined ? { compression } : {}),
    ...(maxAge !== undefined ? { maxAge } : {}),
    buildDependencies: {
      config: [...defaultBuildDependencies, ...buildDependencies],
    },
  };
}

export default getWebpackCacheSettings;
