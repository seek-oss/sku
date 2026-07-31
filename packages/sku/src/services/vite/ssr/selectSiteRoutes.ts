import type { RouteObject } from 'react-router';

/**
 * Select a pre-built site tree for createStaticHandler / createBrowserRouter.
 * Missing or non-string `site`, or a missing map entry, fails closed.
 */
export const selectSiteRoutes = (
  siteRouteTrees: Record<string, RouteObject[]>,
  site: unknown,
  source: 'onRequest' | 'hydrate bootstrap',
): RouteObject[] => {
  if (typeof site !== 'string' || site.length === 0) {
    throw new Error(
      `Vite SSR ${source} must provide a non-empty string 'site'. Missing or invalid 'site'.`,
    );
  }

  const routes = siteRouteTrees[site];
  if (!Array.isArray(routes)) {
    throw new Error(
      `Vite SSR has no pre-built route tree for site '${site}'. Unknown or invalid 'site'.`,
    );
  }

  return routes;
};
