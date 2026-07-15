import type { SkuSsrMiddleware, SkuSsrOnRequest } from 'sku';

import { Providers } from './App/Providers';
import { createRoutes } from './routes';

export const routes = createRoutes();

export const onRequest: SkuSsrOnRequest = () => ({
  AppWrapper: Providers,
});

export const middleware: SkuSsrMiddleware = [];
