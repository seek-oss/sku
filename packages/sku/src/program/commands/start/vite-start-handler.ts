import { viteService } from '@/services/vite/index.js';
import type { SkuContext } from '@/context/createSkuContext.js';
import { metricsMeasurers } from '@/services/telemetry/metricsMeasurers.js';

export const viteStartHandler = async (skuContext: SkuContext) => {
  await viteService.start(skuContext);

  metricsMeasurers.skuStart.mark();
};
