import type { SkuSsrRouteObject } from 'sku';

/**
 * Lazy so the AU site can hover a link to this path and prove sku does not warm
 * a chunk that belongs to another site's tree.
 */
export const nzOnlyRoute = {
  path: 'nz-only',
  sites: ['nz'],
  lazy: () => import('./nz-only.js'),
} satisfies SkuSsrRouteObject;
