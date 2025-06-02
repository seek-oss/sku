import type { StatsChoices } from '../../options/stats/stats.option.js';
import type { SkuContext } from '@/context/createSkuContext.js';

export const startSsrAction = async ({
  stats,
  skuContext,
}: {
  stats: StatsChoices;
  skuContext: SkuContext;
}) => {
  if (skuContext.bundler === 'vite') {
    const { viteStartSsrHandler } = await import('./vite-start-ssr-handler.js');
    viteStartSsrHandler(skuContext);
  } else {
    const { webpackStartSsrHandler } = await import(
      './webpack-start-ssr-handler.js'
    );
    webpackStartSsrHandler({ stats, skuContext });
  }
};
