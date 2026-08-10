import 'virtual:sku/polyfills';
import { hydrateRoot } from 'react-dom/client';
import { createBrowserRouter, matchRoutes, RouterProvider } from 'react-router';
// Resolved by sku's Vite config plugin to the consumer client / routes entries.
import * as clientEntry from '__sku_alias__clientEntry';
import * as routesEntry from '__sku_alias__routesEntry';
import { SkuProvider } from '#runtime/skuContext';
import { registerSiteRouteTree } from '#runtime/preloadRoute';
import Document from '../ssr/Document.js';
import { buildSiteRouteTrees } from '../ssr/buildSiteRouteTrees.js';
import {
  optionalEntryFunction,
  optionalEntryValue,
  optionalNamedFunction,
  requireDefaultEntry,
  requireNamedExport,
} from '../ssr/requireNamedExport.js';
import { assertSiteName, selectForSite } from '../ssr/selectForSite.js';
import type {
  MapRoutePath,
  SkuClientEntry,
  SkuClientGetReactContext,
  SkuClientGetRouterContext,
  SkuOnHydrate,
  SkuRouteObject,
} from '../ssr/types.js';

const routes = requireNamedExport<SkuRouteObject[]>(
  routesEntry,
  'routes',
  'routesEntry',
  { kind: 'routes' },
);

const mapRoutePath = optionalNamedFunction<MapRoutePath>(
  routesEntry,
  'mapRoutePath',
  'routesEntry',
);

const entry = requireDefaultEntry<SkuClientEntry>(clientEntry, 'clientEntry');

const siteRouteTrees = buildSiteRouteTrees(routes, __SKU_SITES__, mapRoutePath);

const onHydrate = optionalEntryFunction<SkuOnHydrate>(entry, 'onHydrate');

const getReactContext = optionalEntryFunction<SkuClientGetReactContext>(
  entry,
  'getReactContext',
);

const getRouterContext = optionalEntryFunction<SkuClientGetRouterContext>(
  entry,
  'getRouterContext',
);

const instrumentations = optionalEntryValue<
  NonNullable<SkuClientEntry['instrumentations']>
>(entry, 'instrumentations');

const hydrate = async () => {
  const site = window.__SKU_SITE__;
  assertSiteName(site, 'hydrate bootstrap');
  const siteRoutes = selectForSite(siteRouteTrees, site, 'hydrate bootstrap');
  // `usePreloadRoute` matches against the same tree the router navigates.
  registerSiteRouteTree(siteRoutes);
  const clientContext = window.__SKU_CLIENT_CONTEXT__;
  onHydrate?.({ clientContext });

  const reactContext = getReactContext?.({ site, clientContext });

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
    ...(getRouterContext
      ? {
          getContext: () =>
            getRouterContext({ site, clientContext, reactContext }),
        }
      : {}),
    ...(instrumentations === undefined ? {} : { instrumentations }),
  });

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
      <SkuProvider
        site={site}
        clientContext={clientContext}
        reactContext={reactContext}
      >
        <RouterProvider router={router} />
      </SkuProvider>
    </Document>,
  );
};

hydrate().catch((error: unknown) => {
  console.error(error);
});
