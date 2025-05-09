import { viteService } from '@/services/vite/index.js';
import type { SkuContext } from '@/context/createSkuContext.js';
import { watchVocabCompile } from '@/services/vocab/runVocab.js';

export const viteStartSsrHandler = async (skuContext: SkuContext) => {
  await watchVocabCompile(skuContext);
  await viteService.startSsr(skuContext);
};
