import type { RouteObject } from 'react-router';

export const helloRoute = {
  path: ':language/hello',
  lazy: () => import('./hello.js'),
} satisfies RouteObject;
