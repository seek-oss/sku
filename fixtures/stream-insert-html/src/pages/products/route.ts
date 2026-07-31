import type { RouteObject } from 'react-router';

export const productsRoute = {
  index: true,
  lazy: () => import('./products.js'),
} satisfies RouteObject;
