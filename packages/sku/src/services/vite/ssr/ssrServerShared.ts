import {
  type Server as HttpServer,
  createServer as createHttpServer,
  type IncomingHttpHeaders,
} from 'node:http';
import type { Server as HttpsServer } from 'node:https';
import express, {
  type Express,
  type Request,
  type RequestHandler,
  type Response,
} from 'express';
import { buildCspHeaders } from './csp.js';
import {
  createSsrRequestContextMiddleware,
  getRequestContextStore,
} from './ssrRequestContextMiddleware.js';
import { createSsrRequestContextStore } from './createSsrRequestContextStore.js';
import type {
  RenderAssets,
  RenderManifest,
  RenderOptions,
  RenderResult,
  SkuSsrMiddleware,
} from './types.js';

const toFetchHeaders = (headers: IncomingHttpHeaders): Headers => {
  const result = new Headers();
  for (const [name, value] of Object.entries(headers)) {
    if (value === undefined) {
      continue;
    }
    if (Array.isArray(value)) {
      for (const entry of value) {
        result.append(name, entry);
      }
    } else {
      result.append(name, value);
    }
  }
  return result;
};

const getRequestBodyInit = (
  req: Request,
  method: string,
): { body?: BodyInit; duplex?: 'half' } => {
  if (method === 'GET' || method === 'HEAD') {
    return {};
  }

  // Body-parser (or similar) already consumed the stream — rebuild from req.body.
  if (req.readableEnded || (req as { complete?: boolean }).complete) {
    if (req.body === undefined || req.body === null) {
      return {};
    }
    if (typeof req.body === 'string') {
      return { body: req.body };
    }
    if (Buffer.isBuffer(req.body)) {
      return { body: new Uint8Array(req.body) };
    }
    if (typeof req.body === 'object') {
      return { body: JSON.stringify(req.body) };
    }
    return { body: String(req.body) };
  }

  return { body: req as unknown as BodyInit, duplex: 'half' };
};

export type RenderFunction = (
  request: globalThis.Request,
  assets: RenderAssets,
  options?: RenderOptions,
  manifest?: RenderManifest,
) => Promise<RenderResult>;

export interface SsrServerOptions {
  port: number;
  base: string;
  middleware?: SkuSsrMiddleware;
  render: RenderFunction;
  assets: RenderAssets;
  manifest?: RenderManifest;
  clientDirectory?: string;
  languages?: string[];
  cspEnabled: boolean;
  cspExtraScriptSrcHosts: string[];
  cspReportOnlyEnabled: boolean;
  cspReportOnlyExtraScriptSrcHosts: string[];
  cspReportOnlyReportTo?: string;
  development?: boolean;
  onRenderError?: (error: Error) => void;
}

export interface SsrServerResult {
  app: Express;
  httpServer: HttpServer | HttpsServer;
}

export const mountConsumerMiddleware = (
  handler: SkuSsrMiddleware | undefined,
  mount: (handler: RequestHandler) => void,
) => {
  const middlewareHandlers = [handler ?? []].flat();
  for (const middleware of middlewareHandlers) {
    mount(middleware);
  }
};

export const createWebRequest = (
  req: Request,
  signal: AbortSignal,
): globalThis.Request => {
  const origin = `${req.protocol}://${req.get('host') ?? 'localhost'}`;
  const method = req.method.toUpperCase();
  const bodyInit = getRequestBodyInit(req, method);
  return new globalThis.Request(new URL(req.originalUrl, origin), {
    method,
    headers: toFetchHeaders(req.headers),
    signal,
    ...bodyInit,
  } as RequestInit);
};

export const sendResponse = async (
  response: globalThis.Response,
  res: Response,
) => {
  response.headers.forEach((value, name) => {
    res.append(name, value);
  });
  res.status(response.status);
  if (response.body) {
    res.end(Buffer.from(await response.arrayBuffer()));
  } else {
    res.end();
  }
};

export const createHtmlRenderMiddleware =
  ({
    render,
    assets,
    manifest,
    languages = [],
    cspEnabled,
    cspExtraScriptSrcHosts,
    cspReportOnlyEnabled,
    cspReportOnlyExtraScriptSrcHosts,
    cspReportOnlyReportTo,
    development = false,
    onRenderError,
  }: Pick<
    SsrServerOptions,
    | 'render'
    | 'assets'
    | 'manifest'
    | 'languages'
    | 'cspEnabled'
    | 'cspExtraScriptSrcHosts'
    | 'cspReportOnlyEnabled'
    | 'cspReportOnlyExtraScriptSrcHosts'
    | 'cspReportOnlyReportTo'
    | 'development'
    | 'onRenderError'
  >): RequestHandler =>
  async (req, res, next) => {
    const controller = new AbortController();
    const onClose = () => {
      if (!res.writableEnded) {
        controller.abort();
      }
    };
    res.once('close', onClose);

    try {
      const requestContextStore =
        getRequestContextStore(req) ?? createSsrRequestContextStore();
      const result = await render(
        createWebRequest(req, controller.signal),
        assets,
        {
          requestContextStore,
          signal: controller.signal,
          development,
          languages,
          onError: (error) => console.error(error),
        },
        manifest,
      );

      if ('response' in result) {
        await sendResponse(result.response, res);
        return;
      }
      if (controller.signal.aborted) {
        return;
      }

      const nonce = requestContextStore.peekCspNonce();
      result.headers.forEach((value, name) => {
        res.append(name, value);
      });
      res.set({
        'Content-Type': 'text/html; charset=utf-8',
        ...buildCspHeaders({
          enabled: cspEnabled,
          reportOnlyEnabled: cspReportOnlyEnabled,
          inlineScripts: result.inlineScripts,
          nonce,
          extraHosts: cspExtraScriptSrcHosts,
          reportOnlyExtraHosts: cspReportOnlyExtraScriptSrcHosts,
          reportOnlyReportTo: cspReportOnlyReportTo,
          development,
        }),
      });
      res.status(result.statusCode);
      controller.signal.addEventListener('abort', result.abort, {
        once: true,
      });
      result.pipe(res);
    } catch (error) {
      if (controller.signal.aborted) {
        return;
      }
      onRenderError?.(error as Error);
      next(error);
    }
  };

export const listen = async (
  options: SsrServerOptions,
): Promise<SsrServerResult> => {
  const serverApp = express();
  const httpServer = createHttpServer(serverApp);

  serverApp.use(createSsrRequestContextMiddleware());
  mountConsumerMiddleware(options.middleware, (middleware) =>
    serverApp.use(middleware),
  );
  if (options.clientDirectory) {
    serverApp.use(options.base, express.static(options.clientDirectory));
  }

  serverApp.use(
    createHtmlRenderMiddleware({
      render: options.render,
      assets: options.assets,
      manifest: options.manifest,
      languages: options.languages,
      cspEnabled: options.cspEnabled,
      cspExtraScriptSrcHosts: options.cspExtraScriptSrcHosts,
      cspReportOnlyEnabled: options.cspReportOnlyEnabled,
      cspReportOnlyExtraScriptSrcHosts:
        options.cspReportOnlyExtraScriptSrcHosts,
      cspReportOnlyReportTo: options.cspReportOnlyReportTo,
      development: options.development,
      onRenderError: options.onRenderError,
    }),
  );

  await new Promise<void>((resolve, reject) => {
    httpServer.once('error', reject);
    httpServer.listen(options.port, resolve);
  });

  return { app: serverApp, httpServer };
};
