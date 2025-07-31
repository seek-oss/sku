import { viteService } from '#src/services/vite/index.js';
import type { SkuContext } from '#src/context/createSkuContext.js';
import { metricsMeasurers } from '#src/services/telemetry/metricsMeasurers.js';

export const viteStartHandler = async (skuContext: SkuContext) => {
  await viteService.start(skuContext);

  metricsMeasurers.skuStart.mark();
};
