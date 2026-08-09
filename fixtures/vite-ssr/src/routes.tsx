import { redirect } from 'react-router';
import type { SkuRouteObject } from 'sku';
import { getCspNonce } from 'sku/runtime';

import { RootLayout } from './RootLayout.js';

export type FixtureSite = 'au' | 'nz';

/**
 * `routesEntry` route tree. Shared routes omit `sites` (every config site).
 * Site-only routes set `sites` explicitly — no parent→child inheritance.
 * The root layout is pathless so it reads as a layout and keeps wrapping any
 * root-level sibling added later; children join against `/` either way.
 *
 * Path / index / sites / lazy live here. loader / action / Component live on
 * the lazily imported page modules (except tiny inline demos below).
 */
export const routes: SkuRouteObject[] = [
  {
    Component: RootLayout,
    children: [
      { index: true, lazy: () => import('./pages/home/home.js') },
      { path: 'about', lazy: () => import('./pages/about/about.js') },
      {
        path: 'redirect',
        loader: () => redirect('/about'),
      },
      { path: 'details', lazy: () => import('./pages/details/details.js') },
      {
        path: 'buffered',
        lazy: () => import('./pages/buffered/buffered.js'),
        handle: {
          waitForAll: true,
        },
      },
      { path: 'boom', lazy: () => import('./pages/error/error.js') },
      { path: ':language/hello', lazy: () => import('./pages/hello/hello.js') },
      { path: 'set-cookie', lazy: () => import('./pages/cookie/cookie.js') },
      { path: 'action', lazy: () => import('./pages/action/action.js') },
      {
        path: 'context-user',
        lazy: () => import('./pages/context-user/context-user.js'),
      },
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
