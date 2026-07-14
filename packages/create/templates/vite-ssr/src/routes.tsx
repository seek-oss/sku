import type { RouteObject } from 'react-router';

import { aboutRoute } from './pages/about/route';
import { homeRoute } from './pages/home/route';

export const routes: RouteObject[] = [
  {
    path: '/',
    children: [homeRoute, aboutRoute],
  },
];
