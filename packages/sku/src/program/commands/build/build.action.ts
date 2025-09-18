import type { StatsChoices } from '../../options/stats/stats.option.js';
import type { SkuContext } from '../../../context/createSkuContext.js';
import { displayPolyfillWarnings } from '../../../utils/polyfillWarnings.js';

export const buildAction = async ({
  stats,
  skuContext,
}: {
  stats: StatsChoices;
  skuContext: SkuContext;
}) => {
  // Check for unnecessary polyfills and display warnings
  displayPolyfillWarnings(skuContext.polyfills);

  if (skuContext.bundler === 'vite') {
    const { viteBuildHandler } = await import('./vite-build-handler.js');
    await viteBuildHandler({ skuContext });
  } else {
    const { webpackBuildHandler } = await import('./webpack-build-handler.js');
    await webpackBuildHandler({ stats, skuContext });
  }
};
