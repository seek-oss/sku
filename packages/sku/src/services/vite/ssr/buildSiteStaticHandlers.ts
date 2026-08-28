import {
  createStaticHandler,
  type RouteObject,
  type ServerInstrumentation,
  type StaticHandler,
} from 'react-router';

/**
 * Create one React Router static handler per pre-built site tree at module init.
 */
export const buildSiteStaticHandlers = (
  siteRouteTrees: Record<string, RouteObject[]>,
  instrumentations?: Array<Pick<ServerInstrumentation, 'route'>>,
): Record<string, StaticHandler> =>
  Object.fromEntries(
    Object.entries(siteRouteTrees).map(([site, routes]) => [
      site,
      instrumentations === undefined
        ? createStaticHandler(routes)
        : createStaticHandler(routes, { instrumentations }),
    ]),
  );
