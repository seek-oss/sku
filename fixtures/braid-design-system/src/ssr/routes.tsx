import { StrictMode } from 'react';
import type { SkuRouteObject } from 'sku/runtime';

import App from '../App.js';

import { useSite } from './skuContext.js';

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
    index: true,
    Component: IndexPage,
  },
];
