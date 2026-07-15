import { VocabProvider } from '@vocab/react';
import type { ReactNode } from 'react';
import { useLocation } from 'react-router';
import type { SkuSsrOnHydrate } from 'sku';

import { resolveLanguageFromPathname } from './resolveLanguage.js';
import { createRoutes } from './routes.js';
import type { ClientContext } from './types.js';

export const routes = createRoutes();

export const onHydrate: SkuSsrOnHydrate = ({ context }) => {
  const clientContext = context as ClientContext;

  // We don't currently do anything with the context in this fixture, so just confirm it exists
  if (!clientContext.fromServer) {
    throw new Error('Missing client context');
  }

  return {
    AppWrapper: ({ children }: { children: ReactNode }) => {
      const { pathname } = useLocation();
      return (
        <VocabProvider language={resolveLanguageFromPathname(pathname)}>
          {children}
        </VocabProvider>
      );
    },
  };
};
