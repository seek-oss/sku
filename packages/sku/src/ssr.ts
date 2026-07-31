// Kept off the main `sku` entry so webpack / static Vite consumers never pull in
// the optional `react-router` peer.
export { usePreloadRoute } from './services/vite/ssr/preloadRoute.js';
export { useInsertHtml } from './services/vite/ssr/insertHtml.js';
