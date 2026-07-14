import type { SkuSsrOnHydrate } from 'sku';

import { Providers } from './App/Providers';

export const onHydrate: SkuSsrOnHydrate = () => ({
  AppWrapper: Providers,
});
