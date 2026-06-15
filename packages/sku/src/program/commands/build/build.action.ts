import type { StatsChoices } from '../../options/stats.option.js';
import type { SkuContext } from '../../../context/createSkuContext.js';
import { validatePolyfills } from '../../../utils/polyfillWarnings.js';
import { initializeTelemetry } from '../../../services/telemetry/index.js';

export const buildAction = async ({
  stats,
  skuContext,
}: {
  stats: StatsChoices;
  skuContext: SkuContext;
}) => {
  initializeTelemetry(skuContext);
  validatePolyfills(skuContext.polyfills);

  if (skuContext.bundler === 'vite') {
    const { viteBuildHandler } = await import('./vite-build-handler.js');
    await viteBuildHandler({ skuContext });
  } else {
    const { webpackBuildHandler } = await import('./webpack-build-handler.js');
    await webpackBuildHandler({ stats, skuContext });
  }
};
