import type { SkuRouteObject } from 'sku';
import { getCspNonce } from 'sku/runtime';

import { RootLayout } from './RootLayout.js';

export const routes: SkuRouteObject[] = [
  {
    Component: RootLayout,
    children: [
      { index: true, lazy: () => import('./pages/home/home.js') },
      { path: 'about', lazy: () => import('./pages/about/about.js') },
      { path: 'details', lazy: () => import('./pages/details/details.js') },
      {
        path: 'buffered',
        lazy: () => import('./pages/buffered/buffered.js'),
        handle: {
          waitForAll: true,
        },
      },
      { path: 'boom', lazy: () => import('./pages/error/error.js') },
      {
        path: 'nonce',
        loader: () => ({ nonce: getCspNonce() }),
        Component: () => <main data-testid="nonce-page">Nonce page</main>,
      },
    ],
  },
];
