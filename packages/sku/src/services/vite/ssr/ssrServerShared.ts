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

const appendFormValue = (
  params: URLSearchParams,
  key: string,
  value: unknown,
) => {
  if (value === undefined || value === null) {
    return;
  }
  if (Array.isArray(value)) {
    for (const item of value) {
      appendFormValue(params, key, item);
    }
    return;
  }
  if (typeof value === 'object') {
    for (const [childKey, childValue] of Object.entries(
      value as Record<string, unknown>,
    )) {
      appendFormValue(params, `${key}[${childKey}]`, childValue);
    }
    return;
  }
  params.append(key, String(value));
};

/** Rebuild a body-parser object using the original Content-Type. */
const rebuildParsedBody = (req: Request): BodyInit => {
  const { body } = req;
  if (typeof body === 'string') {
    return body;
  }
  if (Buffer.isBuffer(body)) {
    return new Uint8Array(body);
  }
  if (typeof body !== 'object' || body === null) {
    return String(body);
  }

  const contentType = String(req.headers['content-type'] ?? '');
  if (contentType.includes('application/x-www-form-urlencoded')) {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(
      body as Record<string, unknown>,
    )) {
      appendFormValue(params, key, value);
    }
    return params.toString();
  }

  return JSON.stringify(body);
};

const getRequestBodyInit = (
  req: Request,
  method: string,
): { body?: BodyInit; duplex?: 'half' } => {
  if (method === 'GET' || method === 'HEAD') {
    return {};
  }

  // Only `readableEnded` means the stream was consumed (e.g. body-parser).
  // Do not use `IncomingMessage.complete` — that is true once the HTTP message
  // has arrived, even when the body buffer is still unread. Async middleware
  // before render commonly hits that race and would otherwise drop POST bodies.
  if (req.readableEnded) {
    if (req.body === undefined || req.body === null) {
      return {};
    }
    return { body: rebuildParsedBody(req) };
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
  middleware: SkuSsrMiddleware;
  render: RenderFunction;
  assets: RenderAssets;
  manifest?: RenderManifest;
  clientDirectory?: string;
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
  handler: SkuSsrMiddleware,
  mount: (handler: RequestHandler) => void,
) => {
  for (const middleware of [handler].flat()) {
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
