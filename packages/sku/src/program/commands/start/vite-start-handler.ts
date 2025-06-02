import { viteService } from '@/services/vite/index.js';
import type { SkuContext } from '@/context/createSkuContext.js';
import { metricsMeasurers } from '@/services/telemetry/metricsMeasurers.js';
import { watchVocabCompile } from '@/services/vocab/runVocab.js';

export const viteStartHandler = async (skuContext: SkuContext) => {
  await watchVocabCompile(skuContext);
  await viteService.start(skuContext);

  metricsMeasurers.skuStart.mark();
};
