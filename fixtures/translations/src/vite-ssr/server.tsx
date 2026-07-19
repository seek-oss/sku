import { VocabProvider } from '@vocab/react';
import type { ReactNode } from 'react';
import { useLocation } from 'react-router';
import type { SkuSsrMiddleware, SkuSsrOnRequest } from 'sku';

import { resolveLanguage } from './resolveLanguage.js';
import { createRoutes } from './routes.js';

export const routes = createRoutes();

export const onRequest: SkuSsrOnRequest = ({ request }) => {
  const url = new URL(request.url);
  const language = resolveLanguage(url.pathname, url.search);

  return {
    language,
    AppWrapper: ({ children }: { children: ReactNode }) => {
      const { pathname, search } = useLocation();
      return (
        <VocabProvider language={resolveLanguage(pathname, search)}>
          {children}
        </VocabProvider>
      );
    },
  };
};

export const middleware: SkuSsrMiddleware = [];
