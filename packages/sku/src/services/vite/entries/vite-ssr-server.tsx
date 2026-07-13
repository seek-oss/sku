// Resolved by sku's Vite SSR plugin to the consumer app module.
// eslint-disable-next-line import-x/no-unresolved
import app from '#sku-vite-ssr-app';
import { render as renderApp } from '../ssr/render.js';
import type {
  RenderAssets,
  RenderManifest,
  RenderOptions,
} from '../ssr/types.js';

export { app };

export const render = (
  request: Request,
  assets: RenderAssets,
  options?: RenderOptions,
  manifest?: RenderManifest,
) => renderApp(app, request, assets, options, manifest);

if (import.meta.env.PROD) {
  const { startProductionSsrServer } =
    await import('../ssr/startProductionSsrServer.js');
  await startProductionSsrServer({ app, render });
}
