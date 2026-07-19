import type { RouteObject } from 'react-router';

import App from '../App.js';

export function createRoutes(): RouteObject[] {
  return [
    {
      path: '*',
      Component: App,
    },
  ];
}
