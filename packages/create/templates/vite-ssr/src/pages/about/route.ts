import type { RouteObject } from 'react-router';

export const aboutRoute = {
  path: 'about',
  lazy: () => import('./about'),
} satisfies RouteObject;
