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

/** Per-attempt ownership: settles at most once (or is abandoned for recovery). */
type AttemptPhase =
  'open' | 'resolved' | 'rejected' | 'cancelled' | 'abandoned';

const abortReason = (signal: AbortSignal | undefined): unknown =>
  signal?.reason ??
  new DOMException('This operation was aborted', 'AbortError');

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
    let phase: AttemptPhase = 'open';
    // Filled synchronously before any React callback or abort listener runs.
    const streamRef: {
      current?: ReturnType<typeof renderToPipeableStream>;
    } = {};

    const settleResolved = (result: RenderResult) => {
      if (phase !== 'open') {
        return;
      }
      phase = 'resolved';
      resolve(result);
    };

    const settleRejected = (error: unknown) => {
      if (phase !== 'open') {
        return;
      }
      phase = 'rejected';
      reject(error);
    };

    const cancelAttempt = () => {
      if (phase !== 'open') {
        return;
      }
      phase = 'cancelled';
      streamRef.current?.abort();
      reject(abortReason(options.signal));
    };

    const retryFromError = (error: unknown) => {
      // Cancellation must never start ErrorBoundary recovery.
      if (phase !== 'open' || !allowErrorRetry) {
        return false;
      }
      // Abandon this attempt so late React callbacks cannot settle or retry again.
      phase = 'abandoned';
      streamRef.current?.abort();
      streamDocument({
        renderContext: getStaticContextFromError(
          dataRoutes,
          renderContext,
          error,
        ),
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
          if (waitForAll || phase !== 'open') {
            return;
          }
          settleResolved({
            pipe: wrapPipeWithInsertHtml(
              stream.pipe.bind(stream),
              insertHtmlQueue,
              stream.abort.bind(stream),
            ),
            abort: stream.abort.bind(stream),
            statusCode: renderContext.statusCode,
            headers: routeHeaders,
            inlineScripts: [bootstrapScriptContent],
          });
        },
        onAllReady() {
          if (!waitForAll || phase !== 'open') {
            return;
          }
          settleResolved({
            pipe: wrapPipeWithInsertHtml(
              stream.pipe.bind(stream),
              insertHtmlQueue,
              stream.abort.bind(stream),
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
          settleRejected(error);
        },
        onError(error) {
          options.onError?.(error);
          // Suspense rejections never settle for onAllReady; retry once we
          // see the error while still buffering for waitForAll.
          // Cancelled / abandoned attempts must not start recovery here.
          if (waitForAll && phase === 'open') {
            retryFromError(error);
          }
        },
      },
    );
    streamRef.current = stream;

    if (options.signal?.aborted) {
      cancelAttempt();
    } else {
      options.signal?.addEventListener('abort', cancelAttempt, { once: true });
    }
  });
};
