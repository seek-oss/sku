import { VocabProvider } from '@vocab/react';
import { Outlet, useLocation } from 'react-router';
import {
  HeadAssets,
  type MapRoutePath,
  type SkuRouteObject,
} from 'sku/runtime';

import App from '../App.js';

import { resolveLanguage } from './resolveLanguage.js';

const RootLayout = () => {
  const { pathname, search } = useLocation();
  const language = resolveLanguage(pathname, search);

  return (
    <VocabProvider language={language}>
      <html lang={language}>
        <head>
          <meta charSet="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <HeadAssets />
        </head>
        <body>
          <Outlet />
        </body>
      </html>
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
