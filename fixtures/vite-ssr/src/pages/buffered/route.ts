import type { RouteObject } from 'react-router';

export const bufferedRoute = {
  path: 'buffered',
  lazy: () => import('./buffered.js'),
  handle: {
    waitForAll: true,
  },
} satisfies RouteObject;
