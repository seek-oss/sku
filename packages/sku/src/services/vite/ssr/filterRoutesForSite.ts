import type { RouteObject } from 'react-router';
import type { ExpandRoutePath, SkuRouteObject } from './types.js';

function assertExpandRoutePathReturn(
  value: unknown,
  path: string,
  site: string,
): asserts value is string[] {
  if (
    !Array.isArray(value) ||
    value.some((entry) => typeof entry !== 'string')
  ) {
    throw new Error(
      `SSR routesEntry expandRoutePath must return string[]. Invalid return for path '${path}' on site '${site}'.`,
    );
  }
}

function cloneExpandedRoute(
  rest: Omit<SkuRouteObject, 'sites' | 'children'>,
  expandedPath: string,
  isIndexSource: boolean,
): RouteObject {
  if (!isIndexSource) {
    return { ...rest, path: expandedPath };
  }

  if (expandedPath === '') {
    const { path: _path, ...withoutPath } = rest;
    return { ...withoutPath, index: true };
  }

  const { index: _index, ...withoutIndex } = rest;
  return { ...withoutIndex, path: expandedPath };
}

/**
 * Deep-filter `routesEntry` `routes` for one config site name, optionally expand
 * paths via `expandRoutePath`, then strip `sites`.
 * - Omit / undefined `sites` ⇒ included for every site
 * - Present `sites` ⇒ included only when the list contains `site` (exact match)
 * - No parent→child inheritance of `sites` (children omit ⇒ still all-sites)
 * - If a parent is excluded, its subtree is absent (structure, not inheritance)
 * - `expandRoutePath` runs for string-`path` routes and `index: true` (`path: ''`)
 * - Not called for pathless layout routes (no `path`, not index)
 * - `parentSegments` use source (pre-expansion) path-bearing ancestors only
 * - Index ancestors do not contribute a segment
 * - Empty expand return omits the route; omitted expand ⇒ identity `[path]` / `['']`
 * - Index `''` keeps `index: true`; non-empty becomes a `path` clone without `index`
 * - Strips `sites` before returning RR `RouteObject`s
 */
export const filterRoutesForSite = (
  routes: SkuRouteObject[],
  site: string,
  expandRoutePath?: ExpandRoutePath,
  parentSegments: readonly string[] = [],
): RouteObject[] =>
  routes.flatMap((route) => {
    const { sites, children, ...rest } = route;

    if (sites !== undefined && !sites.includes(site)) {
      return [];
    }

    const isIndexSource = rest.index === true;
    const authoredPath =
      !isIndexSource && typeof rest.path === 'string' ? rest.path : undefined;
    // Index homes expand with `path: ''`; pathless layouts are not expanded.
    const sourcePath: string | undefined = isIndexSource ? '' : authoredPath;

    const expandedPaths =
      sourcePath === undefined
        ? [undefined]
        : (() => {
            const result = expandRoutePath
              ? expandRoutePath({
                  path: sourcePath,
                  site,
                  parentSegments: [...parentSegments],
                })
              : [sourcePath];
            assertExpandRoutePathReturn(result, sourcePath, site);
            return result;
          })();

    if (expandedPaths.length === 0) {
      return [];
    }

    const nextParentSegments =
      authoredPath === undefined
        ? parentSegments
        : [...parentSegments, authoredPath];

    return expandedPaths.map((expandedPath) => {
      const filtered: RouteObject =
        expandedPath === undefined
          ? { ...rest }
          : cloneExpandedRoute(rest, expandedPath, isIndexSource);

      if (children) {
        filtered.children = filterRoutesForSite(
          children,
          site,
          expandRoutePath,
          nextParentSegments,
        );
      }
      return filtered;
    });
  });

/**
 * Pre-build a site → route tree map from config site names + `routesEntry` routes.
 * Optional `expandRoutePath` runs after `sites` membership filtering.
 * Sku never wraps the tree — `Providers` render outside the router and any
 * router-aware wrapping is the app's own root layout route — so this runs once at
 * module init and nothing here touches the per-request path.
 */
export const buildSiteRouteTrees = (
  routes: SkuRouteObject[],
  siteNames: readonly string[],
  expandRoutePath?: ExpandRoutePath,
): Record<string, RouteObject[]> =>
  Object.fromEntries(
    siteNames.map((name) => [
      name,
      filterRoutesForSite(routes, name, expandRoutePath),
    ]),
  );
