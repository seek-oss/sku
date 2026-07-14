// Resolved by sku's Vite SSR plugin to the consumer routes entry.
// eslint-disable-next-line import-x/no-unresolved
import { routes } from '#sku-vite-ssr-routes';
// Resolved by sku's Vite SSR plugin to the consumer server entry (or noop).
// eslint-disable-next-line import-x/no-unresolved
import * as serverEntry from '#sku-vite-ssr-server-entry';
import { render as renderApp } from '../ssr/render.js';
import type {
  RenderAssets,
  RenderManifest,
  RenderOptions,
  SkuSsrMiddleware,
} from '../ssr/types.js';

export { routes };

export const middleware: SkuSsrMiddleware | undefined = serverEntry.middleware;

export const render = (
  request: Request,
  assets: RenderAssets,
  options?: RenderOptions,
  manifest?: RenderManifest,
) => renderApp(routes, request, assets, options, manifest);

if (import.meta.env.PROD) {
  const { startProductionSsrServer } =
    await import('../ssr/startProductionSsrServer.js');
  await startProductionSsrServer({ middleware, render });
}
