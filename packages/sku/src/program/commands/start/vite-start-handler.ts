import { viteService } from '@/services/vite/index.js';
import type { SkuContext } from '@/context/createSkuContext.js';
import { metricsMeasurers } from '@/services/telemetry/metricsMeasurers.js';

export const viteStartHandler = async (
  skuContext: SkuContext,
  convertLoadable?: boolean,
) => {
  await viteService.start(skuContext, convertLoadable);

  metricsMeasurers.skuStart.mark();
};
