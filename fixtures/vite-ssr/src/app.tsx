import type { RouteObject } from 'react-router';
import { getCspNonce, type SkuApp } from 'sku';

import { RootLayout } from './RootLayout.js';
import { aboutRoutes } from './pages/about/route.js';
import { bufferedRoute } from './pages/buffered/route.js';
import { detailsRoute } from './pages/details/route.js';
import { boomRoute } from './pages/error/route.js';
import { helloRoute } from './pages/hello/route.js';
import { homeRoute } from './pages/home/route.js';

const routes: RouteObject[] = [
  {
    path: '/',
    Component: RootLayout,
    children: [
      homeRoute,
      ...aboutRoutes,
      detailsRoute,
      bufferedRoute,
      boomRoute,
      helloRoute,
      {
        path: 'nonce',
        loader: () => ({ nonce: getCspNonce() }),
        Component: () => <main data-testid="nonce-page">Nonce page</main>,
      },
    ],
  },
];

const middleware: SkuApp['middleware'] = (req, res, next) => {
  // Test helper: prefer `req.skuLanguage` (configured language name) over URL heuristics.
  const skuLanguage = req.get('x-sku-language');
  if (skuLanguage) {
    req.skuLanguage = skuLanguage;
  }
  if (req.path === '/api/health') {
    res.status(200).type('text/plain').send('ok');
    return;
  }
  if (req.path === '/api/nonce') {
    res
      .status(200)
      .type('text/plain')
      .send(req.getCspNonce?.() ?? '');
    return;
  }
  next();
};

export default {
  routes,
  middleware,
} satisfies SkuApp;
