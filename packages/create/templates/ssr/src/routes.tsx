import type { SkuRouteObject } from 'sku/runtime';

import { ErrorBoundary } from './ErrorBoundary';
import { RootLayout } from './RootLayout';

export const routes: SkuRouteObject[] = [
  {
    Component: RootLayout,
    children: [
      {
        ErrorBoundary,
        children: [
          { index: true, lazy: () => import('./pages/home/home') },
          { path: 'about', lazy: () => import('./pages/about/about') },
        ],
      },
    ],
  },
];
