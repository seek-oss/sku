import type { SkuSsrOnHydrate, SkuSsrProviders } from 'sku';

import { ApolloProvider, makeClient } from './ApolloProvider.js';

export const onHydrate: SkuSsrOnHydrate = () => {};

/** Client entry omits `extraScriptProps` — nonce is server-only. */
export const Providers: SkuSsrProviders = ({ children }) => (
  <ApolloProvider makeClient={makeClient}>{children}</ApolloProvider>
);
