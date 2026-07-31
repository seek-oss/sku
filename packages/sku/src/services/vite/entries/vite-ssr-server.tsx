// Resolved by sku's Vite config plugin to the consumer server / routes entries.

import type { Request as ExpressRequest } from 'express';
import * as routesEntry from '__sku_alias__routesEntry';
import * as serverEntry from '__sku_alias__serverEntry';
import { buildSiteStaticHandlers } from '../ssr/buildSiteStaticHandlers.js';
import { buildSiteRouteTrees } from '../ssr/filterRoutesForSite.js';
import {
  optionalNamedComponentExport,
  optionalNamedFunctionExport,
  rejectRoutesBySiteExport,
  requireNamedExport,
} from '../ssr/requireNamedExport.js';
import { render as renderApp } from '../ssr/render.js';
import type {
  RenderAssets,
  RenderManifest,
  RenderOptions,
  SkuSsrMiddleware,
  SkuSsrOnRequest,
  SkuSsrProviders,
  SkuSsrRouteObject,
  SkuSsrServerGetContext,
} from '../ssr/types.js';

rejectRoutesBySiteExport(routesEntry, 'routesEntry');

const routes = requireNamedExport<SkuSsrRouteObject[]>(
  routesEntry,
  'routes',
  'routesEntry',
  { kind: 'routes' },
);

// Providers render outside the router, so the tree — and each site's handler —
// is built once here rather than per request.
const Providers = optionalNamedComponentExport<SkuSsrProviders>(
  serverEntry,
  'Providers',
);

const siteStaticHandlers = buildSiteStaticHandlers(
  buildSiteRouteTrees(routes, __SKU_SITES__),
);

export const onRequest = requireNamedExport<SkuSsrOnRequest>(
  serverEntry,
  'onRequest',
  'serverEntry',
  { kind: 'function' },
);

export const middleware = requireNamedExport<SkuSsrMiddleware>(
  serverEntry,
  'middleware',
  'serverEntry',
);

const getContext = optionalNamedFunctionExport<SkuSsrServerGetContext>(
  serverEntry,
  'getContext',
);

export const render = (
  request: Request,
  req: ExpressRequest,
  assets: RenderAssets,
  options?: RenderOptions,
  manifest?: RenderManifest,
) =>
  renderApp({
    siteStaticHandlers,
    request,
    req,
    assets,
    onRequest,
    options,
    renderManifest: manifest,
    getContext,
    Providers,
  });

if (import.meta.env.PROD) {
  const { startProductionSsrServer } =
    await import('../ssr/startProductionSsrServer.js');
  await startProductionSsrServer({ middleware, render });
}
