import type { SkuSsrMiddleware, SkuSsrOnRequest } from 'sku';

import { resolveLanguage } from './resolveLanguage.js';

// No `Providers` export — language wrapping is the app's root layout route.
export const onRequest: SkuSsrOnRequest = ({ req }) => {
  const url = new URL(req.originalUrl, 'http://localhost');

  return {
    site: 'default',
    language: resolveLanguage(url.pathname, url.search),
  };
};

export const middleware: SkuSsrMiddleware = [];
