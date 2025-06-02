import type { StatsChoices } from '@/program/options/stats/stats.option.js';
import type { SkuContext } from '@/context/createSkuContext.js';

export const buildAction = async ({
  stats,
  skuContext,
}: {
  stats: StatsChoices;
  skuContext: SkuContext;
}) => {
  if (skuContext.bundler === 'vite') {
    const { viteBuildHandler } = await import('./vite-build-handler.js');
    await viteBuildHandler({ skuContext });
  } else {
    const { webpackBuildHandler } = await import('./webpack-build-handler.js');
    await webpackBuildHandler({ stats, skuContext });
  }
};
