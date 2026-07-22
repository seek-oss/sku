import type { RouteObject } from 'react-router';

import { aboutRoute } from './pages/about/route';
import { homeRoute } from './pages/home/route';

/**
 * Shared route tree factory. Import from both `server.tsx` and `client.tsx`
 */
export function createRoutes(): RouteObject[] {
  return [
    {
      path: '/',
      children: [homeRoute, aboutRoute],
    },
  ];
}
