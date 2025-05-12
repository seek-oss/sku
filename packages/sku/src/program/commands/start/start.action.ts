import type { StatsChoices } from '@/program/options/stats/stats.option.js';
import type { SkuContext } from '@/context/createSkuContext.js';
import type { Command } from 'commander';

export const startAction = async (
  {
    stats,
    skuContext,
  }: {
    stats: StatsChoices;
    skuContext: SkuContext;
  },
  command: Command,
) => {
  const { environment } = command.optsWithGlobals();
  if (skuContext.bundler === 'vite') {
    const { viteStartHandler } = await import('./vite-start-handler.js');
    viteStartHandler(skuContext);
  } else {
    const { webpackStartHandler } = await import('./webpack-start-handler.js');
    webpackStartHandler({ stats, environment, skuContext });
  }
};
