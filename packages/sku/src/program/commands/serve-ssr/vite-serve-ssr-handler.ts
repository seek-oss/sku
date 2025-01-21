import type { SkuContext } from '@/context/createSkuContext.js';
import { viteService } from '@/services/vite/index.js';

export const viteServeSsrHandler = ({
  skuContext,
}: {
  skuContext: SkuContext;
}) => {
  viteService.serveSsr(skuContext);
};
