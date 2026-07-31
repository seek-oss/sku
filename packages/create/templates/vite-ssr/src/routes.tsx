import type { SkuSsrRouteObject } from 'sku';

import { aboutRoute } from './pages/about/route';
import { homeRoute } from './pages/home/route';

/** Sole configured site name — return from `onRequest` (must match config `sites`). */
export const site = 'default' as const;

/**
 * Flat `routesEntry` routes. Single-site apps omit `sites` on every route.
 * Sku loads this module via config `routesEntry` (default `src/routes.tsx`).
 */
export const routes: SkuSsrRouteObject[] = [
  {
    path: '/',
    children: [homeRoute, aboutRoute],
  },
];
