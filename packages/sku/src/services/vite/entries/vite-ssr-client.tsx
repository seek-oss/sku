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
  optionalNamedComponentExport,
  optionalNamedFunctionExport,
  rejectRoutesBySiteExport,
  requireNamedExport,
} from '../ssr/requireNamedExport.js';
import { assertSiteName, selectForSite } from '../ssr/selectForSite.js';
import { warnIfClientProvidersRenderMarkup } from '../ssr/warnIfClientProvidersRenderMarkup.js';
import type {
  SkuSsrClientGetContext,
  SkuSsrOnHydrate,
  SkuSsrProviders,
  SkuSsrRouteObject,
} from '../ssr/types.js';

rejectRoutesBySiteExport(routesEntry, 'routesEntry');

const routes = requireNamedExport<SkuSsrRouteObject[]>(
  routesEntry,
  'routes',
  'routesEntry',
  { kind: 'routes' },
);

// The client entry MAY export different providers to the server (e.g. window-only SDKs).
const Providers = optionalNamedComponentExport<SkuSsrProviders>(
  clientEntry,
  'Providers',
);

const siteRouteTrees = buildSiteRouteTrees(routes, __SKU_SITES__);

const onHydrate = requireNamedExport<SkuSsrOnHydrate>(
  clientEntry,
  'onHydrate',
  'clientEntry',
  { kind: 'function' },
);

const getContext = optionalNamedFunctionExport<SkuSsrClientGetContext>(
  clientEntry,
  'getContext',
);

const hydrate = async () => {
  const site = window.__SKU_SITE__;
  assertSiteName(site, 'hydrate bootstrap');
  const siteRoutes = selectForSite(siteRouteTrees, site, 'hydrate bootstrap');
  // `usePreloadRoute` matches against the same tree the router navigates.
  registerSiteRouteTree(siteRoutes);
  const clientContext = window.__SKU_CLIENT_CONTEXT__;
  onHydrate({ clientContext });

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
    // RR native getContext is zero-arg; wrap to inject hydrate clientContext.
    ...(getContext
      ? {
          getContext: () => getContext({ clientContext }),
        }
      : {}),
  });

  // Same props the server passed its own Providers for this document.
  const providerProps = { site, clientContext };

  if (import.meta.env.DEV && Providers) {
    warnIfClientProvidersRenderMarkup(Providers, providerProps);
  }

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
      {Providers ? (
        <Providers {...providerProps}>{routerElement}</Providers>
      ) : (
        routerElement
      )}
    </Document>,
  );
};

hydrate().catch((error: unknown) => {
  console.error(error);
});
