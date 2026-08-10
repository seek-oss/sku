import { VocabProvider } from '@vocab/react';
import { Outlet, useLocation } from 'react-router';
import type { MapRoutePath, SkuRouteObject } from 'sku/runtime';

import App from '../App.js';

import { resolveLanguage } from './resolveLanguage.js';

const RootLayout = () => {
  const { pathname, search } = useLocation();

  return (
    <VocabProvider language={resolveLanguage(pathname, search)}>
      <Outlet />
    </VocabProvider>
  );
};

export const mapRoutePath: MapRoutePath = ({ path, parentSegments }) => {
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
