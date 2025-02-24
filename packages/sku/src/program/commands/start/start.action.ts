import type { StatsChoices } from '@/program/options/stats/stats.option.js';
import type { SkuContext } from '@/context/createSkuContext.js';
import { viteStartHandler } from '@/program/commands/start/vite-start-handler.js';
import type { Command } from 'commander';
import { webpackStartHandler } from '@/program/commands/start/webpack-start-handler.js';

export const startAction = async (
  {
    stats,
    skuContext,
    experimentalBundler,
  }: {
    stats: StatsChoices;
    skuContext: SkuContext;
    experimentalBundler: boolean;
  },
  command: Command,
) => {
  const environment = command.parent?.opts()?.environment;
  if (skuContext.bundler === 'vite' && !experimentalBundler) {
    throw new Error(
      'The `vite` bundler is experimental. If you want to use it please use the `--experimental-bundler` flag.',
    );
  }
  if (skuContext.bundler === 'vite' && experimentalBundler) {
    viteStartHandler(skuContext);
  } else {
    webpackStartHandler({ stats, environment, skuContext });
  }
};
