import { StrictMode } from 'react';
import { Outlet } from 'react-router';
import { HeadAssets, type SkuRouteObject } from 'sku/runtime';

import App from '../App.js';

import { useSite } from './skuContext.js';

const RootLayout = () => (
  <html lang="en">
    <head>
      <meta charSet="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <HeadAssets />
    </head>
    <body>
      <Outlet />
    </body>
  </html>
);

const IndexPage = () => {
  const site = useSite();

  return (
    <StrictMode>
      <App themeName={site} />
    </StrictMode>
  );
};

export const routes: SkuRouteObject[] = [
  {
    Component: RootLayout,
    children: [
      {
        index: true,
        Component: IndexPage,
      },
    ],
  },
];
