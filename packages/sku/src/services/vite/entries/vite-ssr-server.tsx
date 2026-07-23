// Resolved by sku's Vite config plugin to the consumer server entry.

import type { Request as ExpressRequest } from 'express';
import * as serverEntry from '__sku_alias__serverEntry';
import type { RouteObject } from 'react-router';
import {
  optionalNamedFunctionExport,
  requireNamedExport,
} from '../ssr/requireNamedExport.js';
import { render as renderApp } from '../ssr/render.js';
import type {
  RenderAssets,
  RenderManifest,
  RenderOptions,
  SkuSsrMiddleware,
  SkuSsrOnRequest,
  SkuSsrServerGetContext,
} from '../ssr/types.js';

export const routes = requireNamedExport<RouteObject[]>(
  serverEntry,
  'routes',
  'serverEntry',
  { kind: 'array' },
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
  renderApp(
    routes,
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
