import 'virtual:sku/polyfills';
// Resolved by sku's Vite config plugin to the consumer client / routes entries.
import * as clientEntry from '__sku_alias__clientEntry';
import * as routesEntry from '__sku_alias__routesEntry';
import { registerSiteRouteTree } from '#runtime/preloadRoute';
import { buildSiteRouteTrees } from '../ssr/buildSiteRouteTrees.js';
import { hydrateClient } from '../ssr/hydrateClient.js';
import { readRoutesEntry } from '../ssr/readRoutesEntry.js';
import { assertSiteName, selectForSite } from '../ssr/selectForSite.js';
import type { SkuClientEntry } from '../ssr/types.js';

const { routes, mapRoutePath } = readRoutesEntry(routesEntry);

const entry = clientEntry.default;
if (entry == null || typeof entry !== 'object') {
  throw new Error(
    `SSR clientEntry must export default an object (via defineServerEntry / defineClientEntry). Missing or invalid default export.`,
  );
}

const { onHydrate, getReactContext, getRouterContext, instrumentations } =
  entry as SkuClientEntry;

const siteRouteTrees = buildSiteRouteTrees(routes, __SKU_SITES__, mapRoutePath);

const hydrate = async () => {
  const site = window.__SKU_SITE__;
  assertSiteName(site, 'hydrate bootstrap');
  const siteRoutes = selectForSite(siteRouteTrees, site, 'hydrate bootstrap');
  // `usePreloadRoute` matches against the same tree the router navigates.
  registerSiteRouteTree(siteRoutes);
  const clientContext = window.__SKU_CLIENT_CONTEXT__;

  await hydrateClient({
    site,
    clientContext,
    siteRoutes,
    documentAssets: window.__SKU_DOCUMENT_ASSETS__ ?? {
      css: [],
      modulePreloads: [],
    },
    onHydrate,
    getReactContext,
    getRouterContext,
    instrumentations,
  });
};

hydrate().catch((error: unknown) => {
  console.error(error);
});
