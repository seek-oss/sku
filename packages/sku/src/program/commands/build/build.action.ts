import { viteBuildHandler } from './vite-build-handler.js';
import { webpackBuildHandler } from './webpack-build-handler.js';
import type { StatsChoices } from '@/program/options/stats/stats.option.js';
import type { SkuContext } from '@/context/createSkuContext.js';

const buildAction = async ({
  stats,
  skuContext,
  convertLoadable,
}: {
  stats: StatsChoices;
  skuContext: SkuContext;
  convertLoadable: boolean;
}) => {
  if (skuContext.bundler === 'vite') {
    await viteBuildHandler({ skuContext, convertLoadable });
  } else {
    await webpackBuildHandler({ stats, skuContext });
  }
};

export { buildAction };
