import type { RouteObject } from 'react-router';

export const contextRoute = {
  path: 'context-user',
  lazy: () => import('./context-user.js'),
} satisfies RouteObject;
