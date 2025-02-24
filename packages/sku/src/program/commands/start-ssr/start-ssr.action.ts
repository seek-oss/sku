import type { StatsChoices } from '../../options/stats/stats.option.js';
import type { SkuContext } from '@/context/createSkuContext.js';
import { viteStartSsrHandler } from '@/program/commands/start-ssr/vite-start-ssr-handler.js';
import { webpackStartSsrHandler } from '@/program/commands/start-ssr/webpack-start-ssr-handler.js';

export const startSsrAction = async ({
  stats,
  skuContext,
  experimentalBundler,
}: {
  stats: StatsChoices;
  skuContext: SkuContext;
  experimentalBundler: boolean;
}) => {
  if (skuContext.bundler === 'vite' && !experimentalBundler) {
    throw new Error(
      'The `vite` bundler is experimental. If you want to use it please use the `--experimental-bundler` flag.',
    );
  }
  if (skuContext.bundler === 'vite' && experimentalBundler) {
    viteStartSsrHandler(skuContext);
  } else {
    webpackStartSsrHandler({ stats, skuContext });
  }
};
