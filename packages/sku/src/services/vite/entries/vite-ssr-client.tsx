import '@vitejs/plugin-react/preamble';
import { hydrateRoot } from 'react-dom/client';
import {
  createBrowserRouter,
  matchRoutes,
  RouterProvider,
  type RouteObject,
} from 'react-router';
// Resolved by sku's Vite SSR plugin to the consumer client request entry.
// eslint-disable-next-line import-x/no-unresolved
import * as clientEntry from '#sku-vite-ssr-client-entry';
import Document from '../ssr/Document.js';
import { requireNamedExport } from '../ssr/requireNamedExport.js';
import type { SkuSsrOnHydrate } from '../ssr/types.js';
import { withAppWrapperLayout } from '../ssr/withAppWrapperLayout.js';

const routes = requireNamedExport<RouteObject[]>(
  clientEntry,
  'routes',
  'clientEntry',
  { kind: 'array' },
);

const onHydrate = requireNamedExport<SkuSsrOnHydrate>(
  clientEntry,
  'onHydrate',
  'clientEntry',
  { kind: 'function' },
);

const basename = import.meta.env.BASE_URL.replace(/\/$/, '') || undefined;

const hydrate = async () => {
  const { AppWrapper } = onHydrate({
    context: window.__SKU_CLIENT_CONTEXT__,
  });
  const routesWithAppWrapper = withAppWrapperLayout(routes, AppWrapper);

  const lazyMatches = matchRoutes(
    routesWithAppWrapper,
    window.location,
    basename,
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
    basename,
    hydrationData: window.__staticRouterHydrationData,
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
