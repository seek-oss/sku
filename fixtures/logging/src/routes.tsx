import type { SkuRouteObject } from 'sku';

import { ErrorBoundary } from './ErrorBoundary.js';
import { RootLayout } from './RootLayout.js';

export const routes: SkuRouteObject[] = [
  {
    Component: RootLayout,
    ErrorBoundary,
    children: [
      { index: true, lazy: () => import('./pages/home/home.js') },
      {
        path: 'loader-error',
        lazy: () => import('./pages/loader-error.js'),
      },
      {
        path: 'action-error',
        lazy: () => import('./pages/action-error.js'),
      },
      {
        path: 'render-error',
        // @ts-expect-error - Page's Component intentionally throws Error
        lazy: () => import('./pages/render-error.js'),
      },
      {
        path: 'suspense-error',
        lazy: () => import('./pages/suspense-error.js'),
        handle: {
          waitForAll: true,
        },
      },
    ],
  },
];
