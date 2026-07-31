// Resolved by sku's Vite config plugin to the consumer server / routes entries.

import type { Request as ExpressRequest } from 'express';
import * as routesEntry from '__sku_alias__routesEntry';
import * as serverEntry from '__sku_alias__serverEntry';
import { buildSiteRouteTrees } from '../ssr/filterRoutesForSite.js';
import {
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

const siteRouteTrees = buildSiteRouteTrees(routes, __SKU_SITES__);

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
  renderApp(
    siteRouteTrees,
    request,
    req,
    assets,
    onRequest,
    options,
    manifest,
    getContext,
  );

if (import.meta.env.PROD) {
  const { startProductionSsrServer } =
    await import('../ssr/startProductionSsrServer.js');
  await startProductionSsrServer({ middleware, render });
}
