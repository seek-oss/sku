import { renderToPipeableStream } from 'react-dom/server';
import {
  createStaticRouter,
  StaticRouterProvider,
  type DataRouteObject,
  type StaticHandlerContext,
} from 'react-router';
import { createInsertHtmlQueue, InsertHtmlProvider } from '#runtime/insertHtml';
import { SkuProvider } from '#runtime/skuContext';

import { abortReason } from './abortReason.js';
import { bindCommit } from './bindCommit.js';
import { buildBootstrapScriptContent } from './bootstrap.js';
import Document from './Document.js';
import type {
  DocumentAssets,
  JsonValue,
  RenderAssets,
  RenderOptions,
  RenderSuccess,
} from './types.js';

export type CreateDocumentAttemptArgs = {
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
};

export type DocumentAttempt = {
  ready: Promise<RenderSuccess>;
  abort: (reason?: unknown) => void;
};

export const createDocumentAttempt = ({
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
}: CreateDocumentAttemptArgs): DocumentAttempt => {
  const {
    promise: ready,
    resolve,
    reject,
  } = Promise.withResolvers<RenderSuccess>();

  let phase: 'open' | 'closed' = 'open';
  const streamRef: {
    current?: ReturnType<typeof renderToPipeableStream>;
  } = {};

  const abortReact = () => {
    streamRef.current?.abort();
  };

  const settleReady = (handle: RenderSuccess) => {
    if (phase !== 'open') {
      return;
    }
    phase = 'closed';
    resolve(handle);
  };

  const settleError = (error: unknown) => {
    if (phase !== 'open') {
      return;
    }
    phase = 'closed';
    abortReact();
    reject(error);
  };

  const abort = (reason?: unknown) => {
    if (phase === 'open') {
      settleError(reason ?? abortReason(options.signal));
      return;
    }
    abortReact();
  };

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
  const insertHtmlQueue = createInsertHtmlQueue();

  const toHandle = (): RenderSuccess => ({
    statusCode: renderContext.statusCode,
    headers: routeHeaders,
    inlineScripts: [bootstrapScriptContent],
    commit: bindCommit({
      pipe: (destination) => {
        const current = streamRef.current;
        if (!current) {
          throw new Error('Document stream is not ready to pipe');
        }
        return current.pipe(destination);
      },
      abort: abortReact,
      queue: insertHtmlQueue,
    }),
  });

  streamRef.current = renderToPipeableStream(
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
        if (waitForAll) {
          return;
        }
        settleReady(toHandle());
      },
      onAllReady() {
        if (!waitForAll) {
          return;
        }
        settleReady(toHandle());
      },
      onShellError(error) {
        options.onShellError?.(error);
        settleError(error);
      },
      onError(error) {
        options.onError?.(error);
        if (waitForAll) {
          settleError(error);
        }
      },
    },
  );

  return { ready, abort };
};
