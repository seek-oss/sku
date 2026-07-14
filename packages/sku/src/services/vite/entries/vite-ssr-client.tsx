import '@vitejs/plugin-react/preamble';
import type { ReactNode } from 'react';
import { hydrateRoot } from 'react-dom/client';
import { createBrowserRouter, matchRoutes, RouterProvider } from 'react-router';
// Resolved by sku's Vite SSR plugin to the consumer routes entry.
// eslint-disable-next-line import-x/no-unresolved
import { routes } from '#sku-vite-ssr-routes';
// Resolved by sku's Vite SSR plugin to the consumer client request entry (or noop).
// eslint-disable-next-line import-x/no-unresolved
import * as clientEntry from '#sku-vite-ssr-client-entry';
import Document from '../ssr/Document.js';
import type { SkuSsrAppWrapper } from '../ssr/types.js';

const basename = import.meta.env.BASE_URL.replace(/\/$/, '') || undefined;

const wrapRouter = (
  AppWrapper: SkuSsrAppWrapper | undefined,
  children: ReactNode,
) => (AppWrapper ? <AppWrapper>{children}</AppWrapper> : children);

const hydrate = async () => {
  const lazyMatches = matchRoutes(routes, window.location, basename)?.filter(
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

  const router = createBrowserRouter(routes, {
    basename,
    hydrationData: window.__staticRouterHydrationData,
  });

  const { AppWrapper } =
    typeof clientEntry.onHydrate === 'function'
      ? clientEntry.onHydrate({
          context: window.__SKU_CLIENT_CONTEXT__,
          language: window.__SKU_LANGUAGE__,
        })
      : {};

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
      {wrapRouter(AppWrapper, <RouterProvider router={router} />)}
    </Document>,
  );
};

hydrate().catch((error: unknown) => {
  console.error(error);
});
