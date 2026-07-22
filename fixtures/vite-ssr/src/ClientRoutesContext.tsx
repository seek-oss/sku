import { createContext } from 'react';
import type { RouteObject } from 'react-router';

/**
 * Holds the client entry's route tree so intent-based preload links can call
 * `matchRoutes` + `route.lazy()` without importing the factory (and without a
 * circular dependency through RootLayout).
 *
 * Provided only from the client `AppWrapper` — omit on the server; hover/focus
 * never runs during SSR.
 */
export const ClientRoutesContext = createContext<RouteObject[] | null>(null);
