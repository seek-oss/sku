import { RouterContextProvider } from 'react-router';
import type {
  SkuSsrClientGetContext,
  SkuSsrOnHydrate,
  SkuSsrProviders,
} from 'sku';

import type { ClientContext } from './types.js';
import { SkuUserIdReactContext, userIdContext } from './userIdContext.js';

export const onHydrate: SkuSsrOnHydrate = ({ clientContext }) => {
  if (!(clientContext as ClientContext).fromServer) {
    throw new Error('Missing client context');
  }
};

export const Providers: SkuSsrProviders<ClientContext> = ({
  children,
  clientContext,
}) => (
  <SkuUserIdReactContext.Provider value={clientContext?.userId ?? null}>
    {children}
  </SkuUserIdReactContext.Provider>
);

export const getContext: SkuSsrClientGetContext = ({ clientContext }) => {
  const ctx = new RouterContextProvider();
  // Re-derive from browser-visible seed (clientContext) — no Express on client navs.
  const userId = (clientContext as ClientContext | undefined)?.userId ?? null;
  ctx.set(userIdContext, userId);
  return ctx;
};
