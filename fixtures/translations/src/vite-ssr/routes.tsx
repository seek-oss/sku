import type { SkuSsrRouteObject } from 'sku';

import App from '../App.js';

export const routes: SkuSsrRouteObject[] = [
  {
    path: '*',
    Component: App,
  },
];
