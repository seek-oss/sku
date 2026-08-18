import {
  type Server as HttpServer,
  createServer as createHttpServer,
} from 'node:http';
import type { Server as HttpsServer } from 'node:https';
import express, { type Express, type RequestHandler } from 'express';
import type { ReportingEndpoint } from '../../../utils/csp.js';
import { createSsrRequestContextMiddleware } from './ssrRequestContextMiddleware.js';
import {
  createHtmlRenderMiddleware,
  type RenderFunction,
} from './createHtmlRenderMiddleware.js';
import type {
  RenderAssets,
  RenderManifest,
  SkuMiddleware,
  SkuOnListen,
} from './types.js';

export type { RenderFunction } from './createHtmlRenderMiddleware.js';

export interface SsrServerOptions {
  port: number;
  publicPath: string;
  middleware?: SkuMiddleware;
  /** Called once after middleware + HTML are mounted and `listen` succeeds. */
  onListen?: SkuOnListen;
  /** When true, sets Express `trust proxy` hop count to `1`. */
  expressTrustProxy?: boolean;
  render: RenderFunction;
  assets: RenderAssets;
  manifest?: RenderManifest;
  clientDirectory?: string;
  cspEnabled: boolean;
  cspExtraScriptSrcHosts: string[];
  cspReportTo?: ReportingEndpoint;
  cspReportOnlyEnabled: boolean;
  cspReportOnlyExtraScriptSrcHosts: string[];
  cspReportOnlyReportTo?: ReportingEndpoint;
  development?: boolean;
  onRenderError?: (error: Error) => void;
}

/** Bound listen port from `httpServer.address()`, else the configured fallback. */
export const resolveBoundPort = (
  httpServer: HttpServer | HttpsServer,
  fallbackPort: number,
): number => {
  const address = httpServer.address();
  if (typeof address === 'object' && address !== null) {
    return address.port;
  }
  return fallbackPort;
};

export interface SsrServerResult {
  app: Express;
  httpServer: HttpServer | HttpsServer;
}

export const mountConsumerMiddleware = (
  handlers: SkuMiddleware | undefined,
  mount: (handler: RequestHandler) => void,
) => {
  if (handlers == null) {
    return;
  }
  for (const middleware of handlers) {
    mount(middleware);
  }
};

export const listen = async (
  options: SsrServerOptions,
): Promise<SsrServerResult> => {
  const serverApp = express();
  const httpServer = createHttpServer(serverApp);

  if (options.expressTrustProxy) {
    // Hop count 1 (not boolean true) — safer single-hop reverse-proxy case.
    serverApp.set('trust proxy', 1);
  }

  serverApp.use(createSsrRequestContextMiddleware());
  if (options.clientDirectory) {
    serverApp.use(options.publicPath, express.static(options.clientDirectory));
  }
  mountConsumerMiddleware(options.middleware, (middleware) =>
    serverApp.use(middleware),
  );

  serverApp.use(
    createHtmlRenderMiddleware({
      render: options.render,
      assets: options.assets,
      manifest: options.manifest,
      cspEnabled: options.cspEnabled,
      cspExtraScriptSrcHosts: options.cspExtraScriptSrcHosts,
      cspReportTo: options.cspReportTo,
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

  if (options.onListen) {
    try {
      await options.onListen({
        app: serverApp,
        httpServer,
        port: resolveBoundPort(httpServer, options.port),
      });
    } catch (error) {
      await new Promise<void>((resolve, reject) => {
        httpServer.close((closeError) =>
          closeError ? reject(closeError) : resolve(),
        );
      });
      throw error;
    }
  }

  return { app: serverApp, httpServer };
};
