import { viteService } from '@/services/vite/index.js';
import type { SkuContext } from '@/context/createSkuContext.js';

export const viteStartSsrHandler = async (skuContext: SkuContext) => {
  await viteService.startSsr(skuContext);
};
