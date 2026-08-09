import { redirect } from 'react-router';
import type { SkuRouteObject } from 'sku';

import { RootLayout } from './RootLayout.js';

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
      { path: 'set-cookie', lazy: () => import('./pages/cookie/cookie.js') },
      { path: 'action', lazy: () => import('./pages/action/action.js') },
      {
        path: 'context-user',
        lazy: () => import('./pages/context-user/context-user.js'),
      },
    ],
  },
];
