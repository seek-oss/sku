declare module '#sku-vite-ssr-client-entry' {
  import type { RouteObject } from 'react-router';
  import type { SkuSsrOnHydrate } from '../ssr/types.js';

  export const routes: RouteObject[];
  export const onHydrate: SkuSsrOnHydrate;
}
