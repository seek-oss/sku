// Resolved by sku's Vite SSR plugin to the consumer routes entry.
// eslint-disable-next-line import-x/no-unresolved
import * as routesEntry from '#sku-vite-ssr-routes';
// Resolved by sku's Vite SSR plugin to the consumer server entry.
// eslint-disable-next-line import-x/no-unresolved
import * as serverEntry from '#sku-vite-ssr-server-entry';
import type { RouteObject } from 'react-router';
import { requireNamedExport } from '../ssr/requireNamedExport.js';
import { render as renderApp } from '../ssr/render.js';
import type {
  RenderAssets,
  RenderManifest,
  RenderOptions,
  SkuSsrMiddleware,
  SkuSsrOnRequest,
} from '../ssr/types.js';

export const routes = requireNamedExport<RouteObject[]>(
  routesEntry,
  'routes',
  'routesEntry',
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

export const render = (
  request: Request,
  assets: RenderAssets,
  options?: RenderOptions,
  manifest?: RenderManifest,
) => renderApp(routes, request, assets, onRequest, options, manifest);

if (import.meta.env.PROD) {
  const { startProductionSsrServer } =
    await import('../ssr/startProductionSsrServer.js');
  await startProductionSsrServer({ middleware, render });
}
