import type { StatsChoices } from '@/program/options/stats/stats.option.js';
import type { SkuContext } from '@/context/createSkuContext.js';
import { viteStartHandler } from '@/program/commands/start/vite-start-handler.js';
import type { Command } from 'commander';
import { webpackStartHandler } from '@/program/commands/start/webpack-start-handler.js';

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
    viteStartHandler(skuContext);
  } else {
    webpackStartHandler({ stats, environment, skuContext });
  }
};
