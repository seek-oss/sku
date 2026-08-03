import type { SkuRouteObject } from 'sku';

import { RootLayout } from './RootLayout.js';
import { productsRoute } from './pages/products/route.js';
import { reviewsRoute } from './pages/reviews/route.js';

export const routes: SkuRouteObject[] = [
  {
    Component: RootLayout,
    children: [productsRoute, reviewsRoute],
  },
];
