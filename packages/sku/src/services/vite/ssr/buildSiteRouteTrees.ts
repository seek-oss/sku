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

export const buildRoutesForSite = (
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
      const built: RouteObject =
        mappedPath === undefined
          ? { ...rest }
          : cloneMappedRoute(rest, mappedPath, isIndexSource);

      if (built.caseSensitive === undefined) {
        built.caseSensitive = true;
      }

      if (children) {
        built.children = buildRoutesForSite(
          children,
          site,
          mapRoutePath,
          nextParentSegments,
        );
      }
      return built;
    });
  });

/**
 * Pre-build a site → route tree map from config site names + `routesEntry` routes.
 * Optional `mapRoutePath` runs after `sites` membership filtering, then undefined
 * `caseSensitive` is filled to `true`.
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
      buildRoutesForSite(routes, name, mapRoutePath),
    ]),
  );
