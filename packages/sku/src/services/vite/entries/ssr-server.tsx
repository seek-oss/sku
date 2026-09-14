import 'virtual:sku/entry-side-effects';

// Resolved by sku's Vite config plugin to the consumer server / routes entries.

import type { Request as ExpressRequest } from 'express';
import * as routesEntry from '__sku_alias__routesEntry';
import * as serverEntry from '__sku_alias__serverEntry';
import { buildSiteStaticHandlers } from '../ssr/buildSiteStaticHandlers.js';
import { buildSiteRouteTrees } from '../ssr/buildSiteRouteTrees.js';
import { readRoutesEntry } from '../ssr/readRoutesEntry.js';
import { render as renderApp } from '../ssr/render.js';
import type {
  RenderAssets,
  RenderManifest,
  RenderOptions,
  SkuServerEntry,
} from '../ssr/types.js';

const { routes, mapRoutePath } = readRoutesEntry(routesEntry);

const entry = serverEntry.default;
if (entry == null || typeof entry !== 'object') {
  throw new Error(
    `SSR serverEntry must export default an object (via defineServerEntry / defineClientEntry). Missing or invalid default export.`,
  );
}

const {
  getSite,
  getLanguage,
  getClientContext,
  getReactContext,
  getRouterContext,
  middleware,
  onListen,
  instrumentations,
} = entry as SkuServerEntry;

// Route tree — and each site's handler — is built once here rather than per request.
const siteStaticHandlers = buildSiteStaticHandlers(
  buildSiteRouteTrees(routes, __SKU_SITES__, mapRoutePath),
  instrumentations,
);

export { middleware, onListen };

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
