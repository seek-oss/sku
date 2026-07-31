import type { SkuSsrMiddleware, SkuSsrOnRequest } from 'sku';

import { site } from './routes';

export const onRequest: SkuSsrOnRequest = () => ({
  site,
});

// Rendered outside the router, between the Document and the router provider.
export { Providers } from './App/Providers';

export const middleware: SkuSsrMiddleware = [];
