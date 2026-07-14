import type { SkuSsrMiddleware, SkuSsrOnRequest } from 'sku';

import { Providers } from './App/Providers';

export const onRequest: SkuSsrOnRequest = () => ({
  AppWrapper: Providers,
});

export const middleware: SkuSsrMiddleware = [];
