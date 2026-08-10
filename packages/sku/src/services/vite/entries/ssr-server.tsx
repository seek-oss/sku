// Resolved by sku's Vite config plugin to the consumer server / routes entries.

import type { Request as ExpressRequest } from 'express';
import * as routesEntry from '__sku_alias__routesEntry';
import * as serverEntry from '__sku_alias__serverEntry';
import { buildSiteStaticHandlers } from '../ssr/buildSiteStaticHandlers.js';
import { buildSiteRouteTrees } from '../ssr/filterRoutesForSite.js';
import {
  optionalEntryFunction,
  optionalEntryValue,
  optionalNamedFunction,
  optionalOrRequiredEntryFunction,
  requireDefaultEntry,
  requireNamedExport,
} from '../ssr/requireNamedExport.js';
import { render as renderApp } from '../ssr/render.js';
import type {
  ExpandRoutePath,
  RenderAssets,
  RenderManifest,
  RenderOptions,
  SkuGetClientContext,
  SkuGetLanguage,
  SkuGetSite,
  SkuMiddleware,
  SkuOnListen,
  SkuServerEntry,
  SkuServerGetReactContext,
  SkuServerGetRouterContext,
  SkuRouteObject,
} from '../ssr/types.js';

const routes = requireNamedExport<SkuRouteObject[]>(
  routesEntry,
  'routes',
  'routesEntry',
  { kind: 'routes' },
);

const expandRoutePath = optionalNamedFunction<ExpandRoutePath>(
  routesEntry,
  'expandRoutePath',
  'routesEntry',
);

const entry = requireDefaultEntry<SkuServerEntry>(serverEntry, 'serverEntry');

const instrumentations = optionalEntryValue<
  NonNullable<SkuServerEntry['instrumentations']>
>(entry, 'instrumentations');

// Route tree — and each site's handler — is built once here rather than per request.
const siteStaticHandlers = buildSiteStaticHandlers(
  buildSiteRouteTrees(routes, __SKU_SITES__, expandRoutePath),
  instrumentations,
);

// getSite required only when config has more than one site.
const getSite = optionalOrRequiredEntryFunction<SkuGetSite>(
  entry,
  'getSite',
  'serverEntry',
  __SKU_SITES__.length > 1,
);
const getLanguage = optionalEntryFunction<SkuGetLanguage>(entry, 'getLanguage');
const getClientContext = optionalEntryFunction<SkuGetClientContext>(
  entry,
  'getClientContext',
);
const getReactContext = optionalEntryFunction<SkuServerGetReactContext>(
  entry,
  'getReactContext',
);

export const middleware = optionalEntryValue<SkuMiddleware>(
  entry,
  'middleware',
);

export const onListen = optionalEntryFunction<SkuOnListen>(entry, 'onListen');

const getRouterContext = optionalEntryFunction<SkuServerGetRouterContext>(
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
