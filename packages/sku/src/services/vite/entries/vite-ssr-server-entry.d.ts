declare module '#sku-vite-ssr-server-entry' {
  import type { RouteObject } from 'react-router';
  import type { SkuSsrMiddleware, SkuSsrOnRequest } from '../ssr/types.js';

  export const routes: RouteObject[];
  export const onRequest: SkuSsrOnRequest;
  export const middleware: SkuSsrMiddleware;
}
