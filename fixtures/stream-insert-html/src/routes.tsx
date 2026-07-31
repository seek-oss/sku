import type { SkuSsrRouteObject } from 'sku';

import { RootLayout } from './RootLayout.js';
import { productsRoute } from './pages/products/route.js';
import { reviewsRoute } from './pages/reviews/route.js';

export const routes: SkuSsrRouteObject[] = [
  {
    Component: RootLayout,
    children: [productsRoute, reviewsRoute],
  },
];
