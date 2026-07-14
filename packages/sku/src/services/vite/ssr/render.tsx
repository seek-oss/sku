import type { ReactNode } from 'react';
import { renderToPipeableStream } from 'react-dom/server';
import {
  createStaticHandler,
  createStaticRouter,
  StaticRouterProvider,
  type RouteObject,
  type StaticHandlerContext,
} from 'react-router';
import { getChunkName } from '@vocab/vite/chunks';
// Resolved by sku's Vite SSR plugin to the consumer server request entry (or noop).
// eslint-disable-next-line import-x/no-unresolved
import * as serverEntry from '#sku-vite-ssr-server-entry';
import Document from './Document.js';
import { buildBootstrapScriptContent } from './bootstrap.js';
import { createSsrRequestContextStore } from './createSsrRequestContextStore.js';
import {
  getCspNonce,
  getSkuLanguage,
  runWithSsrRequestContext,
} from './requestContext.js';
import {
  resolveAssets,
  warnUnknownModuleIdsWithoutManifest,
} from './resolveAssets.js';
import { resolveRequestLanguage } from './resolveLanguage.js';
import type {
  DocumentAssets,
  RenderAssets,
  RenderManifest,
  RenderOptions,
  RenderResult,
  SkuRouteHandle,
  SkuSsrAppWrapper,
} from './types.js';

/** Merge RR loader/action headers from all matches (append for Set-Cookie). */
const collectRouteHeaders = (context: StaticHandlerContext): Headers => {
  const headers = new Headers();
  for (const { route } of context.matches) {
    const routeId = route.id;
    if (!routeId) {
      continue;
    }
    const loaderHeaders = context.loaderHeaders[routeId];
    const actionHeaders = context.actionHeaders[routeId];
    loaderHeaders?.forEach((value, name) => {
      headers.append(name, value);
    });
    actionHeaders?.forEach((value, name) => {
      headers.append(name, value);
    });
  }
  return headers;
};

const getModuleIds = (
  matches: Array<{
    route: { handle?: unknown; lazy?: unknown; path?: string };
  }>,
  {
    development,
    languages = [],
  }: { development: boolean; languages?: string[] },
): string[] => {
  const moduleIds = matches.flatMap(({ route }) => {
    const moduleId = (route.handle as SkuRouteHandle | undefined)?.moduleId;
    if (development && route.lazy && !moduleId) {
      console.warn(
        `[sku] Lazy route at "${String(route.path ?? '(index)')}" is missing handle.moduleId. Prefer idiomatic lazy: () => import('./pages/…') so sku can auto-derive it, or set handle.moduleId explicitly to the Vite client manifest key (e.g. "src/pages/about.tsx") for production modulepreload links.`,
      );
    }
    return moduleId ? [moduleId] : [];
  });

  const language = resolveRequestLanguage({
    languages,
    requestLanguage: getSkuLanguage(),
  });
  if (language) {
    moduleIds.push(getChunkName(language));
  }

  return moduleIds;
};

const wrapRouter = (
  AppWrapper: SkuSsrAppWrapper | undefined,
  children: ReactNode,
) => (AppWrapper ? <AppWrapper>{children}</AppWrapper> : children);

const renderDocument = async (
  routes: RouteObject[],
  request: Request,
  assets: RenderAssets,
  options: RenderOptions = {},
  renderManifest?: RenderManifest,
): Promise<RenderResult> => {
  const store =
    options.requestContextStore ??
    options.cspNonceStore ??
    createSsrRequestContextStore(options.nonce);

  // Server entry runs before query() so loaders can read getSkuLanguage().
  const requestEntry =
    typeof serverEntry.onRequest === 'function'
      ? await serverEntry.onRequest({ request })
      : {};
  if (requestEntry.language !== undefined) {
    store.setLanguage(requestEntry.language);
  }

  const basename = import.meta.env.BASE_URL.replace(/\/$/, '') || undefined;
  const { query, dataRoutes } = createStaticHandler(routes, { basename });
  const context = await query(request);

  if (context instanceof Response) {
    return { response: context };
  }

  const development = options.development ?? false;
  const moduleIds = getModuleIds(context.matches, {
    development,
    languages: options.languages,
  });
  let documentAssets: DocumentAssets = {
    css: assets.css,
    modulePreloads: assets.modulePreloads,
  };
  if (renderManifest) {
    documentAssets = resolveAssets({
      manifest: renderManifest.manifest,
      base: renderManifest.base,
      entry: renderManifest.entry,
      moduleIds,
      development,
    });
  } else if (development) {
    // No client manifest in middleware-mode; validate path-like ids on disk.
    warnUnknownModuleIdsWithoutManifest(moduleIds);
  }

  const router = createStaticRouter(dataRoutes, context);
  const bootstrapScriptContent = buildBootstrapScriptContent(
    documentAssets,
    context,
    {
      development,
      clientContext: requestEntry.clientContext,
      language: requestEntry.language,
    },
  );
  const routeHeaders = collectRouteHeaders(context);
  const waitForAll = context.matches.some(
    ({ route }) =>
      (route.handle as SkuRouteHandle | undefined)?.waitForAll === true,
  );

  // Mint when attaching nonce to React stream scripts (unhashable post-shell).
  // Consumers may already have requested the same value via getCspNonce / req.getCspNonce.
  const nonce = getCspNonce() ?? options.nonce;

  return new Promise((resolve, reject) => {
    let ready = false;
    const stream = renderToPipeableStream(
      <Document assets={documentAssets}>
        {wrapRouter(
          requestEntry.AppWrapper,
          <StaticRouterProvider
            router={router}
            context={context}
            hydrate={false}
          />,
        )}
      </Document>,
      {
        bootstrapModules: assets.bootstrapModules,
        bootstrapScriptContent,
        nonce,
        onShellReady() {
          if (waitForAll || ready) {
            return;
          }
          ready = true;
          resolve({
            ...stream,
            statusCode: context.statusCode,
            headers: routeHeaders,
            inlineScripts: [bootstrapScriptContent],
          });
        },
        onAllReady() {
          if (!waitForAll || ready) {
            return;
          }
          ready = true;
          resolve({
            ...stream,
            statusCode: context.statusCode,
            headers: routeHeaders,
            inlineScripts: [bootstrapScriptContent],
          });
        },
        onShellError(error) {
          options.onShellError?.(error);
          reject(error);
        },
        onError(error) {
          options.onError?.(error);
        },
      },
    );

    const abort = () => stream.abort();
    if (options.signal?.aborted) {
      abort();
    } else {
      options.signal?.addEventListener('abort', abort, { once: true });
    }
  });
};

export const render = (
  routes: RouteObject[],
  request: Request,
  assets: RenderAssets,
  options: RenderOptions = {},
  renderManifest?: RenderManifest,
): Promise<RenderResult> => {
  // ALS must be established in this Vite-loaded module so consumer
  // helpers (also resolved via the SSR module graph) share the store.
  const store =
    options.requestContextStore ??
    options.cspNonceStore ??
    createSsrRequestContextStore(options.nonce);
  return runWithSsrRequestContext(store, () =>
    renderDocument(
      routes,
      request,
      assets,
      { ...options, requestContextStore: store },
      renderManifest,
    ),
  );
};
