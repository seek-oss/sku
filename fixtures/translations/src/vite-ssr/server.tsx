import { VocabProvider } from '@vocab/react';
import type { ReactNode } from 'react';
import { useLocation } from 'react-router';
import type { SkuSsrMiddleware, SkuSsrOnRequest } from 'sku';

import { resolveLanguage } from './resolveLanguage.js';

export const onRequest: SkuSsrOnRequest = ({ req }) => {
  const url = new URL(req.originalUrl, 'http://localhost');
  const language = resolveLanguage(url.pathname, url.search);

  return {
    site: 'default',
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
