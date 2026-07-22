import type { SkuSsrOnHydrate } from 'sku';

import { Providers } from './App/Providers';
import { createRoutes } from './routes';

export const routes = createRoutes();

export const onHydrate: SkuSsrOnHydrate = () => ({
  AppWrapper: Providers,
});
