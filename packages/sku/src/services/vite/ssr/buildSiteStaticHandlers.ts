import {
  createStaticHandler,
  type RouteObject,
  type StaticHandler,
} from 'react-router';

/**
 * Create one React Router static handler per pre-built site tree at module init.
 * `createStaticHandler` must never run on the request path — per request sku only
 * selects a handler and calls `query()` / `createStaticRouter`.
 */
export const buildSiteStaticHandlers = (
  siteRouteTrees: Record<string, RouteObject[]>,
): Record<string, StaticHandler> =>
  Object.fromEntries(
    Object.entries(siteRouteTrees).map(([site, routes]) => [
      site,
      createStaticHandler(routes),
    ]),
  );
