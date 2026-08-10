import { VocabProvider } from '@vocab/react';
import { Outlet, useLocation } from 'react-router';
import type { ExpandRoutePath, SkuRouteObject } from 'sku/runtime';

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

/**
 * Map the logical `content` path to language-prefixed concrete paths.
 * Nested segments (none here) would see `parentSegments.length > 0` and stay
 * relative under each expanded parent clone.
 */
export const expandRoutePath: ExpandRoutePath = ({ path, parentSegments }) => {
  if (parentSegments.length > 0) {
    return [path];
  }
  if (path === 'content') {
    return ['en', 'fr'];
  }
  return [path];
};

export const routes: SkuRouteObject[] = [
  {
    Component: RootLayout,
    children: [
      {
        path: 'content',
        Component: App,
      },
    ],
  },
];
