import { VocabProvider } from '@vocab/react';
import { Outlet, useLocation } from 'react-router';
import type { SkuSsrRouteObject } from 'sku';

import App from '../App.js';
import { resolveLanguage } from './resolveLanguage.js';

/**
 * App-owned pathless layout route. Language is router-aware, so it belongs here
 * rather than in an entry's `Providers` (which render outside the router).
 */
const RootLayout = () => {
  const { pathname, search } = useLocation();

  return (
    <VocabProvider language={resolveLanguage(pathname, search)}>
      <Outlet />
    </VocabProvider>
  );
};

export const routes: SkuSsrRouteObject[] = [
  {
    Component: RootLayout,
    children: [
      {
        path: '*',
        Component: App,
      },
    ],
  },
];
