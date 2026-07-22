import type { RouteObject } from 'react-router';

export const boomRoute = {
  path: 'boom',
  loader: () => {
    throw new Error('Boom from loader');
  },
  lazy: () => import('./error.js'),
} satisfies RouteObject;
