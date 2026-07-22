import { VocabProvider } from '@vocab/react';
import type { ReactNode } from 'react';
import { useLocation } from 'react-router';
import type { SkuSsrOnHydrate } from 'sku';

import { resolveLanguage } from './resolveLanguage.js';
import { createRoutes } from './routes.js';

export const routes = createRoutes();

export const onHydrate: SkuSsrOnHydrate = () => ({
  AppWrapper: ({ children }: { children: ReactNode }) => {
    const { pathname, search } = useLocation();
    return (
      <VocabProvider language={resolveLanguage(pathname, search)}>
        {children}
      </VocabProvider>
    );
  },
});
