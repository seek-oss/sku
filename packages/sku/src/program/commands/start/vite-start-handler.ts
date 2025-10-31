import { viteService } from '../../../services/vite/index.js';
import type { SkuContext } from '../../../context/createSkuContext.js';
import { metricsMeasurers } from '../../../services/telemetry/metricsMeasurers.js';

export const viteStartHandler = async ({
  skuContext,
  environment,
}: {
  skuContext: SkuContext;
  environment: string;
}) => {
  await viteService.start({ skuContext, environment });

  metricsMeasurers.skuStart.mark();
};
