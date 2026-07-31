import type { SkuSsrOnHydrate } from 'sku';

export const onHydrate: SkuSsrOnHydrate = () => {};

// Rendered outside the router; may differ from the server (e.g. `window`-only SDKs).
export { Providers } from './App/Providers';
