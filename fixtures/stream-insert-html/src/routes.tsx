import type { SkuRouteObject } from 'sku/runtime';

import { RootLayout } from './RootLayout.js';

export const routes: SkuRouteObject[] = [
  {
    Component: RootLayout,
    children: [
      { index: true, lazy: () => import('./pages/products/products.js') },
      { path: 'reviews', lazy: () => import('./pages/reviews/reviews.js') },
    ],
  },
];
