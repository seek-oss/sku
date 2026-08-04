import { renderToPipeableStream, type PipeableStream } from 'react-dom/server';
import type { Request as ExpressRequest } from 'express';
import {
  createStaticRouter,
  StaticRouterProvider,
  type StaticHandler,
  type StaticHandlerContext,
} from 'react-router';
import { getChunkName } from '@vocab/vite/chunks';
import { createInsertHtmlQueue, InsertHtmlProvider } from '#runtime/insertHtml';
import { SkuProvider } from '#runtime/skuContext';
import { runWithSsrRequestContext } from '#runtime/requestContext';
import Document from './Document.js';
import { buildBootstrapScriptContent } from './bootstrap.js';
import { createInsertHtmlTransform } from './createInsertHtmlTransform.js';
import { createSsrRequestContextStore } from './createSsrRequestContextStore.js';
import { getCspNonce } from './requestContext.js';
import {
  resolveAssets,
  warnUnknownModuleIdsWithoutManifest,
} from './resolveAssets.js';
import { selectForSite } from './selectForSite.js';
import type {
  DocumentAssets,
  RenderAssets,
  RenderManifest,
  RenderOptions,
  RenderResult,
  SkuRouteHandle,
  SkuGetClientContext,
  SkuGetLanguage,
  SkuGetSite,
  SkuServerGetReactContext,
  SkuServerGetRouterContext,
} from './types.js';

const wrapPipeWithInsertHtml = (
  pipe: PipeableStream['pipe'],
  queue: ReturnType<typeof createInsertHtmlQueue>,
): PipeableStream['pipe'] => {
  const wrappedPipe: PipeableStream['pipe'] = (destination) => {
    const transform = createInsertHtmlTransform(queue);
    pipe(transform);
    return transform.pipe(destination);
  };
  return wrappedPipe;
};

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
    requestLanguage,
  }: {
    development: boolean;
    requestLanguage?: string;
  },
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

  // Vocab chunk only when getLanguage returns language — no allowlist / sole-language default.
  if (requestLanguage) {
    moduleIds.push(getChunkName(requestLanguage));
  }

  return moduleIds;
};

export interface RenderArgs {
  siteStaticHandlers: Record<string, StaticHandler>;
  request: Request;
  req: ExpressRequest;
  assets: RenderAssets;
  /** Required when config has >1 site; omit on single-site ⇒ sole config site. */
  getSite?: SkuGetSite;
  getLanguage?: SkuGetLanguage;
  getClientContext?: SkuGetClientContext;
  getReactContext?: SkuServerGetReactContext;
  options?: RenderOptions;
  renderManifest?: RenderManifest;
  getRouterContext?: SkuServerGetRouterContext;
}

const renderDocument = async ({
  siteStaticHandlers,
  request,
  req,
  assets,
  getSite,
  getLanguage,
  getClientContext,
  getReactContext,
  options = {},
  renderManifest,
  getRouterContext,
}: RenderArgs): Promise<RenderResult> => {
  // Call order before query(): site → language → clientContext → reactContext → routerContext.
  const site = getSite ? getSite({ req }) : Object.keys(siteStaticHandlers)[0];
  const language = getLanguage?.({ req });
  const clientContext = getClientContext?.({ req });
  const reactContext = getReactContext?.({ req, site, clientContext });

  const { query, dataRoutes } = selectForSite(
    siteStaticHandlers,
    site,
    getSite ? 'getSite' : 'config sites',
  );

  const requestContext = getRouterContext
    ? await getRouterContext({
        request,
        req,
        site,
        clientContext,
        reactContext,
      })
    : undefined;
  const context = await query(
    request,
    requestContext ? { requestContext } : undefined,
  );

  if (context instanceof Response) {
    return { response: context };
  }

  const development = options.development ?? false;
  const moduleIds = getModuleIds(context.matches, {
    development,
    requestLanguage: language,
  });
  let documentAssets: DocumentAssets = {
    css: assets.css,
    modulePreloads: assets.modulePreloads,
  };
  if (renderManifest) {
    documentAssets = resolveAssets({
      manifest: renderManifest.manifest,
      publicPath: renderManifest.publicPath,
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
      clientContext,
      site,
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

  const routerElement = (
    <StaticRouterProvider router={router} context={context} hydrate={false} />
  );

  // Render-scoped: provider wraps Document so route code can reach it;
  // the matching transform flushes queued nodes before each React chunk.
  const insertHtmlQueue = createInsertHtmlQueue();

  return new Promise((resolve, reject) => {
    let ready = false;
    const stream = renderToPipeableStream(
      <InsertHtmlProvider insertHtml={insertHtmlQueue.insertHtml}>
        <Document assets={documentAssets}>
          <SkuProvider
            site={site}
            clientContext={clientContext}
            reactContext={reactContext}
          >
            {routerElement}
          </SkuProvider>
        </Document>
      </InsertHtmlProvider>,
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
            pipe: wrapPipeWithInsertHtml(
              stream.pipe.bind(stream),
              insertHtmlQueue,
            ),
            abort: stream.abort.bind(stream),
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
            pipe: wrapPipeWithInsertHtml(
              stream.pipe.bind(stream),
              insertHtmlQueue,
            ),
            abort: stream.abort.bind(stream),
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

export const render = ({
  options = {},
  ...args
}: RenderArgs): Promise<RenderResult> => {
  // Async Local Storage must be established in this Vite-loaded module so consumer
  // helpers (also resolved via the SSR module graph) share the store.
  const store =
    options.requestContextStore ?? createSsrRequestContextStore(options.nonce);
  return runWithSsrRequestContext(store, () =>
    renderDocument({
      ...args,
      options: { ...options, requestContextStore: store },
    }),
  );
};
