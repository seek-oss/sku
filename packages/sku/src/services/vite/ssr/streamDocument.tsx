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

const RENDER_ATTEMPT_STATE = {
  RENDERING: 'rendering',
  RETRYING: 'retrying',
  READY: 'ready',
  ABORTED: 'aborted',
  FAILED: 'failed',
} as const;

type RenderAttemptState =
  (typeof RENDER_ATTEMPT_STATE)[keyof typeof RENDER_ATTEMPT_STATE];

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
    let state: RenderAttemptState = RENDER_ATTEMPT_STATE.RENDERING;
    let streamAborted = false;
    let removeAbortListener = () => {};

    const abortStream = () => {
      if (streamAborted) {
        return;
      }
      streamAborted = true;
      stream.abort();
    };

    const rejectAttempt = (error: unknown) => {
      if (state !== RENDER_ATTEMPT_STATE.RENDERING) {
        return;
      }
      state = RENDER_ATTEMPT_STATE.FAILED;
      removeAbortListener();
      reject(error);
    };

    const retryFromError = (error: unknown) => {
      if (!allowErrorRetry || state !== RENDER_ATTEMPT_STATE.RENDERING) {
        return false;
      }
      state = RENDER_ATTEMPT_STATE.RETRYING;
      removeAbortListener();
      abortStream();

      const retry = async () => {
        try {
          const errorContext = getStaticContextFromError(
            dataRoutes,
            renderContext,
            error,
          );
          const result = await streamDocument({
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
          });
          resolve(result);
        } catch (retryError) {
          reject(retryError);
        }
      };
      retry();
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
          if (waitForAll || state !== RENDER_ATTEMPT_STATE.RENDERING) {
            return;
          }
          state = RENDER_ATTEMPT_STATE.READY;
          resolve({
            pipe: wrapPipeWithInsertHtml(
              stream.pipe.bind(stream),
              insertHtmlQueue,
              abortStream,
            ),
            abort: abortStream,
            statusCode: renderContext.statusCode,
            headers: routeHeaders,
            inlineScripts: [bootstrapScriptContent],
          });
        },
        onAllReady() {
          if (!waitForAll || state !== RENDER_ATTEMPT_STATE.RENDERING) {
            return;
          }
          state = RENDER_ATTEMPT_STATE.READY;
          resolve({
            pipe: wrapPipeWithInsertHtml(
              stream.pipe.bind(stream),
              insertHtmlQueue,
              abortStream,
            ),
            abort: abortStream,
            statusCode: renderContext.statusCode,
            headers: routeHeaders,
            inlineScripts: [bootstrapScriptContent],
          });
        },
        onShellError(error) {
          if (state !== RENDER_ATTEMPT_STATE.RENDERING) {
            return;
          }
          options.onShellError?.(error);
          if (retryFromError(error)) {
            return;
          }
          rejectAttempt(error);
        },
        onError(error) {
          if (
            state !== RENDER_ATTEMPT_STATE.RENDERING &&
            state !== RENDER_ATTEMPT_STATE.READY
          ) {
            return;
          }
          options.onError?.(error);
          // Suspense rejections never settle for onAllReady; retry once we
          // see the error while still buffering for waitForAll.
          if (waitForAll && state === RENDER_ATTEMPT_STATE.RENDERING) {
            retryFromError(error);
          }
        },
      },
    );

    const signal = options.signal;
    const abortFromSignal = () => {
      if (
        state === RENDER_ATTEMPT_STATE.RETRYING ||
        state === RENDER_ATTEMPT_STATE.ABORTED ||
        state === RENDER_ATTEMPT_STATE.FAILED
      ) {
        return;
      }
      state = RENDER_ATTEMPT_STATE.ABORTED;
      abortStream();
      reject(
        signal?.reason ??
          new DOMException('The render was aborted', 'AbortError'),
      );
    };

    if (signal?.aborted) {
      abortFromSignal();
    } else if (signal) {
      signal.addEventListener('abort', abortFromSignal, { once: true });
      removeAbortListener = () =>
        signal.removeEventListener('abort', abortFromSignal);
    } else {
      removeAbortListener = () => {};
    }
  });
};
