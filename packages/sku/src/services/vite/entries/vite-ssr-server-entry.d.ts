declare module '#sku-vite-ssr-server-entry' {
  import type { SkuSsrMiddleware, SkuSsrOnRequest } from '../ssr/types.js';

  export const onRequest: SkuSsrOnRequest;
  export const middleware: SkuSsrMiddleware;
}
