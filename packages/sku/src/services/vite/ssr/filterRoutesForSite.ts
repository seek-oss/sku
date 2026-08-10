import type { RouteObject } from 'react-router';
import type { MapRoutePath, SkuRouteObject } from './types.js';

function assertMapRoutePathReturn(
  value: unknown,
  path: string,
  site: string,
): asserts value is string[] {
  if (
    !Array.isArray(value) ||
    value.some((entry) => typeof entry !== 'string')
  ) {
    throw new Error(
      `SSR routesEntry mapRoutePath must return string[]. Invalid return for path '${path}' on site '${site}'.`,
    );
  }
}

function cloneMappedRoute(
  rest: Omit<SkuRouteObject, 'sites' | 'children'>,
  mappedPath: string,
  isIndexSource: boolean,
): RouteObject {
  if (!isIndexSource) {
    return { ...rest, path: mappedPath };
  }

  if (mappedPath === '') {
    const { path: _path, ...withoutPath } = rest;
    return { ...withoutPath, index: true };
  }

  const { index: _index, ...withoutIndex } = rest;
  return { ...withoutIndex, path: mappedPath };
}

/**
 * Deep-filter `routesEntry` `routes` for one config site name, optionally map
 * paths via `mapRoutePath`, then strip `sites`.
 * - Omit / undefined `sites` ⇒ included for every site
 * - Present `sites` ⇒ included only when the list contains `site` (exact match)
 * - No parent→child inheritance of `sites` (children omit ⇒ still all-sites)
 * - If a parent is excluded, its subtree is absent (structure, not inheritance)
 * - `mapRoutePath` runs for string-`path` routes and `index: true` (`path: ''`)
 * - Not called for pathless layout routes (no `path`, not index)
 * - `parentSegments` use source (pre-mapping) path-bearing ancestors only
 * - Index ancestors do not contribute a segment
 * - Empty map return omits the route; omitted map ⇒ identity `[path]` / `['']`
 * - Index `''` keeps `index: true`; non-empty becomes a `path` clone without `index`
 * - Strips `sites` before returning RR `RouteObject`s
 */
export const filterRoutesForSite = (
  routes: SkuRouteObject[],
  site: string,
  mapRoutePath?: MapRoutePath,
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

    const mappedPaths =
      sourcePath === undefined
        ? [undefined]
        : (() => {
            const result = mapRoutePath
              ? mapRoutePath({
                  path: sourcePath,
                  site,
                  parentSegments: [...parentSegments],
                })
              : [sourcePath];
            assertMapRoutePathReturn(result, sourcePath, site);
            return result;
          })();

    if (mappedPaths.length === 0) {
      return [];
    }

    const nextParentSegments =
      authoredPath === undefined
        ? parentSegments
        : [...parentSegments, authoredPath];

    return mappedPaths.map((mappedPath) => {
      const filtered: RouteObject =
        mappedPath === undefined
          ? { ...rest }
          : cloneMappedRoute(rest, mappedPath, isIndexSource);

      if (children) {
        filtered.children = filterRoutesForSite(
          children,
          site,
          mapRoutePath,
          nextParentSegments,
        );
      }
      return filtered;
    });
  });

/**
 * Pre-build a site → route tree map from config site names + `routesEntry` routes.
 * Optional `mapRoutePath` runs after `sites` membership filtering.
 * Sku never wraps the tree — `Providers` render outside the router and any
 * router-aware wrapping is the app's own root layout route — so this runs once at
 * module init and nothing here touches the per-request path.
 */
export const buildSiteRouteTrees = (
  routes: SkuRouteObject[],
  siteNames: readonly string[],
  mapRoutePath?: MapRoutePath,
): Record<string, RouteObject[]> =>
  Object.fromEntries(
    siteNames.map((name) => [
      name,
      filterRoutesForSite(routes, name, mapRoutePath),
    ]),
  );
