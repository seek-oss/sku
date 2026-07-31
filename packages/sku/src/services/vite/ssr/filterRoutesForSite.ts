import type { RouteObject } from 'react-router';
import type { SkuSsrRouteObject } from './types.js';

/**
 * Deep-filter `routesEntry` `routes` for one config site name.
 * - Omit / undefined `sites` ⇒ included for every site
 * - Present `sites` ⇒ included only when the list contains `site` (exact match)
 * - No parent→child inheritance of `sites` (children omit ⇒ still all-sites)
 * - If a parent is excluded, its subtree is absent (structure, not inheritance)
 * - Strips `sites` before returning RR `RouteObject`s
 */
export const filterRoutesForSite = (
  routes: SkuSsrRouteObject[],
  site: string,
): RouteObject[] =>
  routes.flatMap((route) => {
    const { sites, children, ...rest } = route;

    if (sites !== undefined && !sites.includes(site)) {
      return [];
    }

    const filtered: RouteObject = { ...rest };
    if (children) {
      filtered.children = filterRoutesForSite(children, site);
    }
    return [filtered];
  });

/**
 * Pre-build a site → route tree map from config site names + `routesEntry` routes.
 */
export const buildSiteRouteTrees = (
  routes: SkuSsrRouteObject[],
  siteNames: readonly string[],
): Record<string, RouteObject[]> =>
  Object.fromEntries(
    siteNames.map((name) => [name, filterRoutesForSite(routes, name)]),
  );
