import { renderToPipeableStream } from 'react-dom/server';
import {
  createStaticRouter,
  StaticRouterProvider,
  type DataRouteObject,
  type StaticHandlerContext,
} from 'react-router';
import { createInsertHtmlQueue, InsertHtmlProvider } from '#runtime/insertHtml';
import { SkuProvider } from '#runtime/skuContext';

import Document from './Document.js';
import { buildBootstrapScriptContent } from './bootstrap.js';
import { getStaticContextFromError } from './getStaticContextFromError.js';
import { wrapPipeWithInsertHtml } from './wrapPipeWithInsertHtml.js';
import type {
  DocumentAssets,
  JsonValue,
  RenderAssets,
  RenderOptions,
  RenderResult,
} from './types.js';

export type StreamDocumentArgs = {
  renderContext: StaticHandlerContext;
  dataRoutes: DataRouteObject[];
  documentAssets: DocumentAssets;
  assets: RenderAssets;
  site: string;
  clientContext: JsonValue | undefined;
  reactContext: unknown;
  routeHeaders: Headers;
  waitForAll: boolean;
  nonce?: string;
  options: RenderOptions;
  allowErrorRetry: boolean;
};

export const streamDocument = ({
  renderContext,
  dataRoutes,
  documentAssets,
  assets,
  site,
  clientContext,
  reactContext,
  routeHeaders,
  waitForAll,
  nonce,
  options,
  allowErrorRetry,
}: StreamDocumentArgs): Promise<RenderResult> => {
  const router = createStaticRouter(dataRoutes, renderContext);
  const bootstrapScriptContent = buildBootstrapScriptContent(
    documentAssets,
    renderContext,
    {
      development: options.development ?? false,
      clientContext,
      site,
    },
  );

  // Render-scoped: provider wraps Document so route code can reach it;
  // the matching transform flushes queued nodes before each React chunk.
  const insertHtmlQueue = createInsertHtmlQueue();

  return new Promise((resolve, reject) => {
    let ready = false;
    let abortedForRetry = false;

    const retryFromError = (error: unknown) => {
      if (!allowErrorRetry || abortedForRetry) {
        return false;
      }
      abortedForRetry = true;
      stream.abort();
      const errorContext = getStaticContextFromError(
        dataRoutes,
        renderContext,
        error,
      );
      streamDocument({
        renderContext: errorContext,
        dataRoutes,
        documentAssets,
        assets,
        site,
        clientContext,
        reactContext,
        routeHeaders,
        waitForAll,
        nonce,
        options,
        allowErrorRetry: false,
      }).then(resolve, reject);
      return true;
    };

    const stream = renderToPipeableStream(
      <InsertHtmlProvider insertHtml={insertHtmlQueue.insertHtml}>
        <Document assets={documentAssets}>
          <SkuProvider
            site={site}
            clientContext={clientContext}
            reactContext={reactContext}
          >
            <StaticRouterProvider
              router={router}
              context={renderContext}
              hydrate={false}
            />
          </SkuProvider>
        </Document>
      </InsertHtmlProvider>,
      {
        bootstrapModules: assets.bootstrapModules,
        bootstrapScriptContent,
        nonce,
        onShellReady() {
          if (waitForAll || ready || abortedForRetry) {
            return;
          }
          ready = true;
          resolve({
            pipe: wrapPipeWithInsertHtml(
              stream.pipe.bind(stream),
              insertHtmlQueue,
            ),
            abort: stream.abort.bind(stream),
            statusCode: renderContext.statusCode,
            headers: routeHeaders,
            inlineScripts: [bootstrapScriptContent],
          });
        },
        onAllReady() {
          if (!waitForAll || ready || abortedForRetry) {
            return;
          }
          ready = true;
          resolve({
            pipe: wrapPipeWithInsertHtml(
              stream.pipe.bind(stream),
              insertHtmlQueue,
            ),
            abort: stream.abort.bind(stream),
            statusCode: renderContext.statusCode,
            headers: routeHeaders,
            inlineScripts: [bootstrapScriptContent],
          });
        },
        onShellError(error) {
          options.onShellError?.(error);
          if (retryFromError(error)) {
            return;
          }
          reject(error);
        },
        onError(error) {
          options.onError?.(error);
          // Suspense rejections never settle for onAllReady; retry once we
          // see the error while still buffering for waitForAll.
          if (waitForAll && !ready) {
            retryFromError(error);
          }
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
