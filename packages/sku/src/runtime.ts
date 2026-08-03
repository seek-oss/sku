/**
 * Browser-safe SSR public API.
 *
 * Shared SSR state (provider context, insert-html queue, preload registry, CSP
 * nonce storage) must keep **one** module identity for app code and sku’s own
 * SSR runtime. Prefer this `sku/runtime` specifier for both; keep tsdown
 * `unbundle: true` so dist retains one physical module per shared file; and
 * exclude `'sku'` / `'sku/runtime'` from Vite `optimizeDeps` so published installs
 * are not cloned into `.vite/deps`.
 */
export { usePreloadRoute } from './services/vite/ssr/preloadRoute.js';
export { useInsertHtml } from './services/vite/ssr/insertHtml.js';
export {
  defineClientEntry,
  defineServerEntry,
} from './services/vite/ssr/defineEntry.js';
export type { ServerEntryBody } from './services/vite/ssr/defineEntry.js';
export { createSkuContexts } from './services/vite/ssr/skuContext.js';
export type {
  JsonValue,
  SkuClientEntry,
  SkuClientGetReactContext,
  SkuClientGetRouterContext,
  SkuGetClientContext,
  SkuGetLanguage,
  SkuGetSite,
  SkuMiddleware,
  SkuOnHydrate,
  SkuOnListen,
  SkuRouteObject,
  SkuServerEntry,
  SkuServerGetReactContext,
  SkuServerGetRouterContext,
} from './services/vite/ssr/types.js';
export { getCspNonce } from './services/vite/ssr/requestContext.js';

/** @internal Sku SSR runtime — import via `sku/runtime` for shared identity. */
export { SkuProvider } from './services/vite/ssr/skuContext.js';
/** @internal Sku SSR runtime — import via `sku/runtime` for shared identity. */
export {
  InsertHtmlProvider,
  createInsertHtmlQueue,
} from './services/vite/ssr/insertHtml.js';
/** @internal Sku SSR runtime — import via `sku/runtime` for shared identity. */
export { registerSiteRouteTree } from './services/vite/ssr/preloadRoute.js';
/** @internal Sku SSR runtime — import via `sku/runtime` for shared identity. */
export { runWithSsrRequestContext } from './services/vite/ssr/requestContext.js';
