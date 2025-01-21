import type { StatsChoices } from '@/program/options/stats/stats.option.js';
import { SkuContext } from '@/context/createSkuContext.js';
import { viteBuildSsrHandler } from '@/program/commands/build-ssr/vite-build-ssr-handler.js';
import { webpackBuildSsrHandler } from '@/program/commands/build-ssr/webpack-build-ssr-handler.js';

export const buildSsrAction = async ({
  stats,
  skuContext,
}: {
  stats: StatsChoices;
  skuContext: SkuContext;
}) => {
  if (skuContext.bundler === 'vite') {
    viteBuildSsrHandler({ skuContext });
  } else {
    webpackBuildSsrHandler({ stats, skuContext });
  }
};
