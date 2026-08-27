import { hydrateRoot } from 'react-dom/client';
import {
  createBrowserRouter,
  matchRoutes,
  RouterProvider,
  type ClientInstrumentation,
  type RouteObject,
} from 'react-router';
import { SkuProvider } from '#runtime/skuContext';
import { Document } from './Document.js';
import type {
  DocumentAssets,
  JsonValue,
  SkuClientGetReactContext,
  SkuClientGetRouterContext,
  SkuOnHydrate,
} from './types.js';

export type HydrateClientArgs = {
  site: string;
  clientContext: JsonValue | undefined;
  siteRoutes: RouteObject[];
  documentAssets: DocumentAssets;
  onHydrate?: SkuOnHydrate;
  getReactContext?: SkuClientGetReactContext;
  getRouterContext?: SkuClientGetRouterContext;
  instrumentations?: ClientInstrumentation[];
};

/**
 * Await client `getReactContext` (when present), then create the browser
 * router and hydrate. `onHydrate` runs first with the serialised seed.
 */
export const hydrateClient = async ({
  site,
  clientContext,
  siteRoutes,
  documentAssets,
  onHydrate,
  getReactContext,
  getRouterContext,
  instrumentations,
}: HydrateClientArgs): Promise<void> => {
  onHydrate?.({ clientContext });

  const reactContext = await getReactContext?.({ site, clientContext });

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
    <Document assets={documentAssets}>
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
