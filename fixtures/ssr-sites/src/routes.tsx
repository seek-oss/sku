import type { MapRoutePath, SkuRouteObject } from 'sku/runtime';

import { RootLayout } from './RootLayout.js';

/**
 * Localisation-root paths get a site-prefixed sibling on AU only.
 * Index homes use `path: ''` — `''` keeps the unprefixed `/`, `'au'` becomes `/au`.
 * Nested segments leave `parentSegments.length > 0` and stay relative.
 */
export const mapRoutePath: MapRoutePath = ({ path, site, parentSegments }) => {
  if (parentSegments.length > 0) {
    return [path];
  }
  if (site === 'au') {
    if (path === '') {
      return ['', 'au'];
    }
    if (path === 'about') {
      return ['about', 'au/about'];
    }
  }
  return [path];
};

/**
 * `routesEntry` route tree. Shared routes omit `sites` (every config site).
 * Site-only routes set `sites` explicitly — no parent→child inheritance.
 * `mapRoutePath` clones the index home and `about` for AU so `/` + `/au`
 * and `/about` + `/au/about` share the same lazy modules (preload-safe).
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
