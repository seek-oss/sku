declare module '#sku-vite-ssr-client-entry' {
  import type { SkuSsrOnHydrate } from '../ssr/types.js';

  export const onHydrate: SkuSsrOnHydrate | undefined;
}
