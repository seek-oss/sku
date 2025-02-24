import { viteBuildHandler } from './vite-build-handler.js';
import { webpackBuildHandler } from './webpack-build-handler.js';
import type { StatsChoices } from '@/program/options/stats/stats.option.js';
import type { SkuContext } from '@/context/createSkuContext.js';

const buildAction = async ({
  stats,
  skuContext,
  experimentalBundler,
}: {
  stats: StatsChoices;
  skuContext: SkuContext;
  experimentalBundler: boolean;
}) => {
  console.log('Building your application...', skuContext.bundler);
  if (skuContext.bundler === 'vite' && !experimentalBundler) {
    throw new Error(
      'The `vite` bundler is experimental. If you want to use it please use the `--experimental-bundler` flag.',
    );
  }
  if (skuContext.bundler === 'vite' && experimentalBundler) {
    await viteBuildHandler({ skuContext });
  } else {
    await webpackBuildHandler({ stats, skuContext });
  }
};

export { buildAction };
