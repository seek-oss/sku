import { createContext } from 'react';
import type { RouteObject } from 'react-router';

/**
 * Holds the routesEntry route tree so intent-based preload links can call
 * `matchRoutes` + `route.lazy()` without importing routes into RootLayout
 * (avoids a circular dependency).
 *
 * Provided only from the client `AppWrapper` — omit on the server; hover/focus
 * never runs during SSR.
 */
export const ClientRoutesContext = createContext<RouteObject[] | null>(null);
