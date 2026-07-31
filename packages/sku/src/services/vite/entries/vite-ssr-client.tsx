import 'virtual:sku/polyfills';
import { hydrateRoot } from 'react-dom/client';
import { createBrowserRouter, matchRoutes, RouterProvider } from 'react-router';
// Resolved by sku's Vite config plugin to the consumer client / routes entries.
import * as clientEntry from '__sku_alias__clientEntry';
import * as routesEntry from '__sku_alias__routesEntry';
import Document from '../ssr/Document.js';
import { buildSiteRouteTrees } from '../ssr/filterRoutesForSite.js';
import {
  optionalNamedFunctionExport,
  rejectRoutesBySiteExport,
  requireNamedExport,
} from '../ssr/requireNamedExport.js';
import { selectSiteRoutes } from '../ssr/selectSiteRoutes.js';
import type {
  SkuSsrClientGetContext,
  SkuSsrOnHydrate,
  SkuSsrRouteObject,
} from '../ssr/types.js';
import { withAppWrapperLayout } from '../ssr/withAppWrapperLayout.js';

rejectRoutesBySiteExport(routesEntry, 'routesEntry');

const routes = requireNamedExport<SkuSsrRouteObject[]>(
  routesEntry,
  'routes',
  'routesEntry',
  { kind: 'routes' },
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
  const siteRoutes = selectSiteRoutes(
    siteRouteTrees,
    site,
    'hydrate bootstrap',
  );
  const clientContext = window.__SKU_CLIENT_CONTEXT__;
  const { AppWrapper } = onHydrate({
    context: clientContext,
  });
  const routesWithAppWrapper = withAppWrapperLayout(siteRoutes, AppWrapper);

  // publicPath is the static asset prefix only — never React Router basename.
  const lazyMatches = matchRoutes(
    routesWithAppWrapper,
    window.location,
  )?.filter(({ route }) => route.lazy);

  await Promise.all(
    lazyMatches?.map(async ({ route }) => {
      const lazy = route.lazy;
      if (typeof lazy !== 'function') {
        return;
      }
      Object.assign(route, await lazy(), { lazy: undefined });
    }) ?? [],
  );

  const router = createBrowserRouter(routesWithAppWrapper, {
    hydrationData: window.__staticRouterHydrationData,
    // RR native getContext is zero-arg; wrap to inject hydrate clientContext.
    ...(getContext
      ? {
          getContext: () => getContext({ clientContext }),
        }
      : {}),
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
      <RouterProvider router={router} />
    </Document>,
  );
};

hydrate().catch((error: unknown) => {
  console.error(error);
});
