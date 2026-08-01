import type { SkuSsrRouteObject } from 'sku';

import { RootLayout } from './App/RootLayout';
import { aboutRoute } from './pages/about/route';
import { homeRoute } from './pages/home/route';

/**
 * Flat `routesEntry` routes. Single-site apps omit `sites` on every route and
 * omit `getSite` — sku uses the sole config site name (`sites: ['default']`).
 * Sku loads this module via config `routesEntry` (default `src/routes.tsx`).
 * The root layout is pathless so it reads as a layout and keeps wrapping any
 * root-level sibling added later; children join against `/` either way.
 */
export const routes: SkuSsrRouteObject[] = [
  {
    Component: RootLayout,
    children: [homeRoute, aboutRoute],
  },
];
