import type { StatsChoices } from '@/program/options/stats/stats.option.js';
import type { SkuContext } from '@/context/createSkuContext.js';
import { viteStartHandler } from '@/program/commands/start/vite-start-handler.js';
import type { Command } from 'commander';
import { webpackStartHandler } from '@/program/commands/start/webpack-start-handler.js';

export const startAction = async (
  {
    stats,
    skuContext,
    convertLoadable,
  }: {
    stats: StatsChoices;
    skuContext: SkuContext;
    convertLoadable: boolean;
  },
  command: Command,
) => {
  const { environment } = command.optsWithGlobals();
  if (skuContext.bundler === 'vite') {
    viteStartHandler(skuContext, convertLoadable);
  } else {
    webpackStartHandler({ stats, environment, skuContext });
  }
};
