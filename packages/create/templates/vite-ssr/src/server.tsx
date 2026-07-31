import type { SkuSsrMiddleware, SkuSsrOnRequest } from 'sku';

import { Providers } from './App/Providers';
import { site } from './routes';

export const onRequest: SkuSsrOnRequest = () => ({
  site,
  AppWrapper: Providers,
});

export const middleware: SkuSsrMiddleware = [];
