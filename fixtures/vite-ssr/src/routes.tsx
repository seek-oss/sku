import { type SkuSsrRouteObject, getCspNonce } from 'sku';

import { RootLayout } from './RootLayout.js';
import { aboutRoutes } from './pages/about/route.js';
import { actionRoute } from './pages/action/route.js';
import { bufferedRoute } from './pages/buffered/route.js';
import { contextRoute } from './pages/context-user/route.js';
import { cookieRoute } from './pages/cookie/route.js';
import { detailsRoute } from './pages/details/route.js';
import { boomRoute } from './pages/error/route.js';
import { helloRoute } from './pages/hello/route.js';
import { homeRoute } from './pages/home/route.js';

export type FixtureSite = 'au' | 'nz';

/**
 * Flat `routesEntry` routes. Shared routes omit `sites` (every config site).
 * Site-only routes set `sites` explicitly — no parent→child inheritance.
 */
export const routes: SkuSsrRouteObject[] = [
  {
    path: '/',
    Component: RootLayout,
    children: [
      homeRoute,
      ...aboutRoutes,
      detailsRoute,
      bufferedRoute,
      boomRoute,
      helloRoute,
      cookieRoute,
      actionRoute,
      contextRoute,
      {
        path: 'nonce',
        loader: () => ({ nonce: getCspNonce() }),
        Component: () => <main data-testid="nonce-page">Nonce page</main>,
      },
      {
        path: 'au-only',
        sites: ['au'],
        Component: () => <main data-testid="au-only-page">AU only</main>,
      },
      {
        path: 'nz-only',
        sites: ['nz'],
        Component: () => <main data-testid="nz-only-page">NZ only</main>,
      },
    ],
  },
];
