import { redirect, type RouteObject } from 'react-router';

export const aboutRoutes = [
  {
    path: 'about',
    lazy: () => import('./about.js'),
  },
  {
    path: 'redirect',
    loader: () => redirect('/about'),
  },
] satisfies RouteObject[];
