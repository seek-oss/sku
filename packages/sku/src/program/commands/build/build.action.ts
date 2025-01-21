import { viteBuildHandler } from './vite-build-handler.js';
import { webpackBuildHandler } from './webpack-build-handler.js';
import type { StatsChoices } from '@/program/options/stats/stats.option.js';
import type { SkuContext } from '@/context/createSkuContext.js';

const buildAction = async ({
  stats,
  skuContext,
}: {
  stats: StatsChoices;
  skuContext: SkuContext;
}) => {
  console.log('Building your application...', skuContext.bundler);
  if (skuContext.bundler === 'vite') {
    await viteBuildHandler({ skuContext });
  } else {
    await webpackBuildHandler({ stats, skuContext });
  }
};

export { buildAction };
