// Kept off the main `sku` entry so webpack / static Vite consumers never pull in
// the optional `react-router` peer (and so shared context modules stay unbundled).
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
