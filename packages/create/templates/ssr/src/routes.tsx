import type { SkuRouteObject } from 'sku';

import { RootLayout } from './RootLayout';
import { aboutRoute } from './pages/about/route';
import { homeRoute } from './pages/home/route';

export const routes: SkuRouteObject[] = [
  {
    Component: RootLayout,
    children: [homeRoute, aboutRoute],
  },
];
