import type { RouteObject } from 'react-router';

export const homeRoute = {
  index: true,
  lazy: () => import('./home'),
} satisfies RouteObject;
