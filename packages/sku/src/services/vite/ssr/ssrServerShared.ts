import {
  createServer as createHttpServer,
  type Server as HttpServer,
} from 'node:http';
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
import { createSsrRequestContextStore } from './requestContext.js';
import type {
  RenderAssets,
  RenderManifest,
  RenderOptions,
  RenderResult,
  SkuApp,
} from './types.js';

export type RenderFunction = (
  request: globalThis.Request,
  assets: RenderAssets,
  options?: RenderOptions,
  manifest?: RenderManifest,
) => Promise<RenderResult>;

export interface SsrServerOptions {
  port: number;
  base: string;
  app: SkuApp;
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
  httpServer: HttpServer;
}

export const mountConsumerMiddleware = (
  handler: SkuApp['middleware'],
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
  return new globalThis.Request(new URL(req.originalUrl, origin), {
    method,
    headers: req.headers as HeadersInit,
    signal,
    ...(method === 'GET' || method === 'HEAD'
      ? {}
      : { body: req as unknown as BodyInit, duplex: 'half' }),
  } as RequestInit);
};

export const sendResponse = async (
  response: globalThis.Response,
  res: Response,
) => {
  response.headers.forEach((value, name) => res.setHeader(name, value));
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
          requestLanguage: req.skuLanguage,
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
      result.headers.forEach((value, name) => res.setHeader(name, value));
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
  mountConsumerMiddleware(options.app.middleware, (middleware) =>
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
