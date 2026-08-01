// Resolved by sku's Vite config plugin to the consumer server / routes entries.

import type { Request as ExpressRequest } from 'express';
import * as routesEntry from '__sku_alias__routesEntry';
import * as serverEntry from '__sku_alias__serverEntry';
import { buildSiteStaticHandlers } from '../ssr/buildSiteStaticHandlers.js';
import { buildSiteRouteTrees } from '../ssr/filterRoutesForSite.js';
import {
  optionalEntryFunction,
  optionalEntryValue,
  optionalOrRequiredEntryFunction,
  rejectRoutesBySiteExport,
  requireDefaultEntry,
  requireNamedExport,
} from '../ssr/requireNamedExport.js';
import { render as renderApp } from '../ssr/render.js';
import type {
  RenderAssets,
  RenderManifest,
  RenderOptions,
  SkuSsrGetClientContext,
  SkuSsrGetLanguage,
  SkuSsrGetSite,
  SkuSsrMiddleware,
  SkuSsrOnListen,
  SkuSsrServerEntry,
  SkuSsrServerGetReactContext,
  SkuSsrServerGetRouterContext,
  SkuSsrRouteObject,
} from '../ssr/types.js';

rejectRoutesBySiteExport(routesEntry, 'routesEntry');

const routes = requireNamedExport<SkuSsrRouteObject[]>(
  routesEntry,
  'routes',
  'routesEntry',
  { kind: 'routes' },
);

const entry = requireDefaultEntry<SkuSsrServerEntry>(
  serverEntry,
  'serverEntry',
);

// Route tree — and each site's handler — is built once here rather than per request.
const siteStaticHandlers = buildSiteStaticHandlers(
  buildSiteRouteTrees(routes, __SKU_SITES__),
);

// getSite required only when config has more than one site.
const getSite = optionalOrRequiredEntryFunction<SkuSsrGetSite>(
  entry,
  'getSite',
  'serverEntry',
  __SKU_SITES__.length > 1,
);
const getLanguage = optionalEntryFunction<SkuSsrGetLanguage>(
  entry,
  'getLanguage',
);
const getClientContext = optionalEntryFunction<SkuSsrGetClientContext>(
  entry,
  'getClientContext',
);
const getReactContext = optionalEntryFunction<SkuSsrServerGetReactContext>(
  entry,
  'getReactContext',
);

export const middleware = optionalEntryValue<SkuSsrMiddleware>(
  entry,
  'middleware',
);

export const onListen = optionalEntryFunction<SkuSsrOnListen>(
  entry,
  'onListen',
);

const getRouterContext = optionalEntryFunction<SkuSsrServerGetRouterContext>(
  entry,
  'getRouterContext',
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
    getSite,
    getLanguage,
    getClientContext,
    getReactContext,
    options,
    renderManifest: manifest,
    getRouterContext,
  });

if (import.meta.env.PROD) {
  const { startProductionSsrServer } =
    await import('../ssr/startProductionSsrServer.js');
  await startProductionSsrServer({ middleware, onListen, render });
}
