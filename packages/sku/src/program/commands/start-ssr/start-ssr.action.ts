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
    throw new Error(
      'The command does not supported the Vite bundler at this time. SSR is only supported with Webpack.',
    );
  }

  const { webpackStartSsrHandler } = await import(
    './webpack-start-ssr-handler.js'
  );
  webpackStartSsrHandler({ stats, skuContext });
};
