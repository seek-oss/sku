import { viteService } from '@/services/vite/index.js';
import type { SkuContext } from '@/context/createSkuContext.js';

export const viteStartHandler = async (skuContext: SkuContext) => {
  await viteService.start(skuContext);
};
