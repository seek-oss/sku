import { VocabProvider } from '@vocab/react';
import type { ReactNode } from 'react';
import { RouterContextProvider, useLocation } from 'react-router';
import type { SkuSsrClientGetContext, SkuSsrOnHydrate } from 'sku';

import { ClientRoutesContext } from './ClientRoutesContext.js';
import { resolveLanguageFromPathname } from './resolveLanguage.js';
import { createRoutes } from './routes.js';
import type { ClientContext } from './types.js';
import { SkuUserIdReactContext, userIdContext } from './userIdContext.js';

export const routes = createRoutes();

export const onHydrate: SkuSsrOnHydrate = ({ context }) => {
  const clientContext = context as ClientContext;

  // We don't currently do anything with the context in this fixture, so just confirm it exists
  if (!clientContext.fromServer) {
    throw new Error('Missing client context');
  }

  const userId = clientContext.userId ?? null;

  return {
    AppWrapper: ({ children }: { children: ReactNode }) => {
      const { pathname } = useLocation();
      return (
        <ClientRoutesContext.Provider value={routes}>
          <SkuUserIdReactContext.Provider value={userId}>
            <VocabProvider language={resolveLanguageFromPathname(pathname)}>
              {children}
            </VocabProvider>
          </SkuUserIdReactContext.Provider>
        </ClientRoutesContext.Provider>
      );
    },
  };
};

export const getContext: SkuSsrClientGetContext = ({ clientContext }) => {
  const ctx = new RouterContextProvider();
  // Re-derive from browser-visible seed (clientContext) — no Express on client navs.
  const userId = (clientContext as ClientContext | undefined)?.userId ?? null;
  ctx.set(userIdContext, userId);
  return ctx;
};
