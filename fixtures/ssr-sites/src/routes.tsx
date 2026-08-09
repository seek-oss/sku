import type { SkuRouteObject } from 'sku';

import { RootLayout } from './RootLayout.js';

/**
 * `routesEntry` route tree. Shared routes omit `sites` (every config site).
 * Site-only routes set `sites` explicitly — no parent→child inheritance.
 */
export const routes: SkuRouteObject[] = [
  {
    Component: RootLayout,
    children: [
      { index: true, lazy: () => import('./pages/home/home.js') },
      { path: 'about', lazy: () => import('./pages/about/about.js') },
      {
        path: 'au-only',
        sites: ['au'],
        Component: () => <main data-testid="au-only-page">AU only</main>,
      },
      /**
       * Lazy so the AU site can hover a link to this path and prove sku does
       * not warm a chunk that belongs to another site's tree.
       */
      {
        path: 'nz-only',
        sites: ['nz'],
        lazy: () => import('./pages/nz-only/nz-only.js'),
      },
    ],
  },
];
