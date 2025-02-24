import type { StatsChoices } from '../../options/stats/stats.option.js';
import type { SkuContext } from '@/context/createSkuContext.js';
import { viteStartSsrHandler } from '@/program/commands/start-ssr/vite-start-ssr-handler.js';
import { webpackStartSsrHandler } from '@/program/commands/start-ssr/webpack-start-ssr-handler.js';

export const startSsrAction = async ({
  stats,
  skuContext,
}: {
  stats: StatsChoices;
  skuContext: SkuContext;
}) => {
  if (skuContext.bundler === 'vite') {
    viteStartSsrHandler(skuContext);
  } else {
    webpackStartSsrHandler({ stats, skuContext });
  }
};
