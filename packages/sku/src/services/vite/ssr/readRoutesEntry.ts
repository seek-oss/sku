import type { MapRoutePath, SkuRouteObject } from './types.js';

export const readRoutesEntry = (
  mod: object,
): {
  routes: SkuRouteObject[];
  mapRoutePath?: MapRoutePath;
} => {
  const { routes, mapRoutePath } = mod as Record<string, unknown>;

  if (!Array.isArray(routes)) {
    throw new Error(
      `routesEntry must export named 'routes' as an array. Missing or non-array 'routes' export.`,
    );
  }

  if (mapRoutePath !== undefined && typeof mapRoutePath !== 'function') {
    throw new Error(
      `routesEntry must export named 'mapRoutePath' as a function when present. Invalid 'mapRoutePath' export.`,
    );
  }

  return {
    routes: routes as SkuRouteObject[],
    mapRoutePath: mapRoutePath as MapRoutePath | undefined,
  };
};
