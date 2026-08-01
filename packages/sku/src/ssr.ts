/**
 * Browser-safe Vite SSR public API.
 *
 * Shared SSR state (provider context, insert-html queue, preload registry, CSP
 * nonce storage) must keep **one** module identity for app code and sku’s own
 * Vite SSR runtime. Prefer this `sku/ssr` specifier for both; keep tsdown
 * `unbundle: true` so dist retains one physical module per shared file; and
 * exclude `'sku'` / `'sku/ssr'` from Vite `optimizeDeps` so published installs
 * are not cloned into `.vite/deps`.
 */
export { usePreloadRoute } from './services/vite/ssr/preloadRoute.js';
export { useInsertHtml } from './services/vite/ssr/insertHtml.js';
export {
  defineClientEntry,
  defineServerEntry,
} from './services/vite/ssr/defineEntry.js';
export type { ServerEntryBody } from './services/vite/ssr/defineEntry.js';
export { createSkuSsrContexts } from './services/vite/ssr/skuSsrContext.js';
export type {
  JsonValue,
  SkuSsrClientEntry,
  SkuSsrClientGetReactContext,
  SkuSsrClientGetRouterContext,
  SkuSsrGetClientContext,
  SkuSsrGetLanguage,
  SkuSsrGetSite,
  SkuSsrMiddleware,
  SkuSsrOnHydrate,
  SkuSsrOnListen,
  SkuSsrRouteObject,
  SkuSsrServerEntry,
  SkuSsrServerGetReactContext,
  SkuSsrServerGetRouterContext,
} from './services/vite/ssr/types.js';
export { getCspNonce } from './services/vite/ssr/requestContext.js';

/** @internal Sku Vite SSR runtime — import via `sku/ssr` for shared identity. */
export { SkuSsrProvider } from './services/vite/ssr/skuSsrContext.js';
/** @internal Sku Vite SSR runtime — import via `sku/ssr` for shared identity. */
export {
  InsertHtmlProvider,
  createInsertHtmlQueue,
} from './services/vite/ssr/insertHtml.js';
/** @internal Sku Vite SSR runtime — import via `sku/ssr` for shared identity. */
export { registerSiteRouteTree } from './services/vite/ssr/preloadRoute.js';
/** @internal Sku Vite SSR runtime — import via `sku/ssr` for shared identity. */
export { runWithSsrRequestContext } from './services/vite/ssr/requestContext.js';
