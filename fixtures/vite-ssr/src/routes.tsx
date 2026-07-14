import type { RouteObject } from 'react-router';
import { getCspNonce } from 'sku';

import { RootLayout } from './RootLayout.js';
import { aboutRoutes } from './pages/about/route.js';
import { actionRoute } from './pages/action/route.js';
import { bufferedRoute } from './pages/buffered/route.js';
import { cookieRoute } from './pages/cookie/route.js';
import { detailsRoute } from './pages/details/route.js';
import { boomRoute } from './pages/error/route.js';
import { helloRoute } from './pages/hello/route.js';
import { homeRoute } from './pages/home/route.js';

export const routes: RouteObject[] = [
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
      {
        path: 'nonce',
        loader: () => ({ nonce: getCspNonce() }),
        Component: () => <main data-testid="nonce-page">Nonce page</main>,
      },
    ],
  },
];
