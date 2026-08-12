import { matchRoutes, useHref, type RouteObject, type To } from 'react-router';

let siteRouteTree: RouteObject[] | null = null;
let warnedWithoutRouteTree = false;

export const registerSiteRouteTree = (routes: RouteObject[]): void => {
  siteRouteTree = routes;
};

const ignoreWarmUpFailure = () => {
  // The real navigation reports the error; intent warm-up is fire-and-forget.
};

const warmRoute = ({ lazy }: RouteObject): void => {
  if (typeof lazy === 'function') {
    // The module graph caches the import, so navigation's later `lazy()` call
    // resolves from cache.
    Promise.resolve(lazy()).catch(ignoreWarmUpFailure);
    return;
  }

  if (lazy && typeof lazy === 'object') {
    for (const loadProperty of Object.values(lazy)) {
      if (typeof loadProperty === 'function') {
        Promise.resolve(loadProperty()).catch(ignoreWarmUpFailure);
      }
    }
  }
};

/** Warm every lazy module a href matches within `routes`. */
export const preloadMatchedRoutes = (
  routes: RouteObject[],
  href: string,
): void => {
  for (const { route } of matchRoutes(routes, href) ?? []) {
    warmRoute(route);
  }
};

export const preloadHref = (
  href: string,
  warn: (message: string) => void = console.warn,
): void => {
  if (!siteRouteTree) {
    if (
      import.meta.env.DEV &&
      typeof document !== 'undefined' &&
      !warnedWithoutRouteTree
    ) {
      warnedWithoutRouteTree = true;
      warn(
        'sku: usePreloadRoute did no work because no route tree is registered. Intent preloading is only available in SSR apps (\'buildType: "ssr"\').',
      );
    }
    return;
  }

  preloadMatchedRoutes(siteRouteTree, href);
};

/**
 * Returns a fire-and-forget function that warms the lazy modules for `to`.
 * Intended for hover / focus / touch handlers on links — React Router Data Mode
 * has no `<Link prefetch>`.
 *
 * Matching runs against the current site's tree, so a path belonging to another
 * site never warms. Outside SSR (and during server render) it is a no-op.
 */
export const usePreloadRoute = (to: To): (() => void) => {
  const href = useHref(to);

  return () => preloadHref(href);
};
