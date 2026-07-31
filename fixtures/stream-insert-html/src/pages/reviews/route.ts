import type { RouteObject } from 'react-router';

export const reviewsRoute = {
  path: 'reviews',
  lazy: () => import('./reviews.js'),
} satisfies RouteObject;
