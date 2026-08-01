import 'virtual:sku/polyfills';
import { hydrateRoot } from 'react-dom/client';
import { createBrowserRouter, matchRoutes, RouterProvider } from 'react-router';
// Resolved by sku's Vite config plugin to the consumer client / routes entries.
import * as clientEntry from '__sku_alias__clientEntry';
import * as routesEntry from '__sku_alias__routesEntry';
import Document from '../ssr/Document.js';
import { buildSiteRouteTrees } from '../ssr/filterRoutesForSite.js';
import { registerSiteRouteTree } from '../ssr/preloadRoute.js';
import {
  optionalEntryFunction,
  rejectRoutesBySiteExport,
  requireDefaultEntry,
  requireNamedExport,
} from '../ssr/requireNamedExport.js';
import { assertSiteName, selectForSite } from '../ssr/selectForSite.js';
import { SkuSsrProvider } from '../ssr/skuSsrContext.js';
import type {
  SkuSsrClientEntry,
  SkuSsrClientGetReactContext,
  SkuSsrClientGetRouterContext,
  SkuSsrOnHydrate,
  SkuSsrRouteObject,
} from '../ssr/types.js';

rejectRoutesBySiteExport(routesEntry, 'routesEntry');

const routes = requireNamedExport<SkuSsrRouteObject[]>(
  routesEntry,
  'routes',
  'routesEntry',
  { kind: 'routes' },
);

const entry = requireDefaultEntry<SkuSsrClientEntry>(
  clientEntry,
  'clientEntry',
);

const siteRouteTrees = buildSiteRouteTrees(routes, __SKU_SITES__);

const onHydrate = optionalEntryFunction<SkuSsrOnHydrate>(entry, 'onHydrate');

const getReactContext = optionalEntryFunction<SkuSsrClientGetReactContext>(
  entry,
  'getReactContext',
);

const getRouterContext = optionalEntryFunction<SkuSsrClientGetRouterContext>(
  entry,
  'getRouterContext',
);

const hydrate = async () => {
  const site = window.__SKU_SITE__;
  assertSiteName(site, 'hydrate bootstrap');
  const siteRoutes = selectForSite(siteRouteTrees, site, 'hydrate bootstrap');
  // `usePreloadRoute` matches against the same tree the router navigates.
  registerSiteRouteTree(siteRoutes);
  const clientContext = window.__SKU_CLIENT_CONTEXT__;
  onHydrate?.({ clientContext });

  const reactContext = getReactContext?.({ site, clientContext });

  // publicPath is the static asset prefix only — never React Router basename.
  const lazyMatches = matchRoutes(siteRoutes, window.location)?.filter(
    ({ route }) => route.lazy,
  );

  await Promise.all(
    lazyMatches?.map(async ({ route }) => {
      const lazy = route.lazy;
      if (typeof lazy !== 'function') {
        return;
      }
      Object.assign(route, await lazy(), { lazy: undefined });
    }) ?? [],
  );

  const router = createBrowserRouter(siteRoutes, {
    hydrationData: window.__staticRouterHydrationData,
    // RR native getContext is zero-arg; wrap sku getRouterContext to inject
    // hydrate sibling values.
    ...(getRouterContext
      ? {
          getContext: () =>
            getRouterContext({ site, clientContext, reactContext }),
        }
      : {}),
  });

  const routerElement = <RouterProvider router={router} />;

  hydrateRoot(
    document,
    <Document
      assets={
        window.__SKU_DOCUMENT_ASSETS__ ?? {
          css: [],
          modulePreloads: [],
        }
      }
    >
      <SkuSsrProvider
        site={site}
        clientContext={clientContext}
        reactContext={reactContext}
      >
        {routerElement}
      </SkuSsrProvider>
    </Document>,
  );
};

hydrate().catch((error: unknown) => {
  console.error(error);
});
