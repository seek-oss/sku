import {
  type Server as HttpServer,
  type ServerResponse,
  createServer as createHttpServer,
} from 'node:http';
import type { Server as HttpsServer } from 'node:https';
import express, { type Express, type RequestHandler } from 'express';
import type { CspExtraSources, ReportingEndpoint } from '../../../utils/csp.js';
import {
  createProbeMiddleware,
  mountProbeRoutes,
  PROBE_DRAIN_SIGNALS,
} from './createProbeMiddleware.js';
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
  SkuOnShutdown,
} from './types.js';

/** Outlives a proxy idle timeout of about 30 seconds. The socket timer fires one second later. */
const PRODUCTION_KEEP_ALIVE_TIMEOUT_MS = 35_000;

/** Leaves 5 seconds of a 30 second termination grace period as margin for signal delivery and exit. */
const SHUTDOWN_DEADLINE_MS = 25_000;

export type { RenderFunction } from './createHtmlRenderMiddleware.js';

export interface SsrServerOptions {
  port: number;
  publicPath: string;
  middleware?: SkuMiddleware;
  /** Called once after middleware + HTML are mounted and `listen` succeeds. */
  onListen?: SkuOnListen;
  /** Called with no arguments after in-flight responses finish on `SIGTERM` or `SIGINT`. */
  onShutdown?: SkuOnShutdown;
  /** When true, sets Express `trust proxy` hop count to `1`. */
  expressTrustProxy?: boolean;
  render: RenderFunction;
  assets: RenderAssets;
  manifest?: RenderManifest;
  clientDirectory?: string;
  cspEnabled: boolean;
  cspExtraSources: CspExtraSources;
  cspReportTo?: ReportingEndpoint;
  cspReportOnlyEnabled: boolean;
  cspReportOnlyExtraSources: CspExtraSources;
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

/**
 * Throws when the process has a `SIGTERM` listener that is not in
 * `hostListeners`, which `sku start` uses for listeners that never run in
 * production.
 */
export const assertNoExistingSigtermListeners = (
  hostListeners: ReadonlySet<unknown> = new Set(),
) => {
  const listeners = process
    .listeners('SIGTERM')
    .filter((listener) => !hostListeners.has(listener));
  if (listeners.length === 0) {
    return;
  }

  const names = listeners
    .map((listener) => listener.name)
    .filter((name) => name.length > 0);
  const named = names.length > 0 ? `: ${names.join(', ')}` : '';
  const noun = listeners.length === 1 ? 'listener' : 'listeners';

  throw new Error(
    `Found ${listeners.length} SIGTERM ${noun}${named}. A dependency can register a SIGTERM listener. Move shutdown work to onShutdown. For a dependency's listener, turn off its signal handling in onListen with the dependency's own option or function, and call its shutdown from onShutdown. If it has no such option or function, call process.removeAllListeners('SIGTERM') in onListen instead.`,
  );
};

const closeHttpServer = (httpServer: HttpServer | HttpsServer) =>
  new Promise<void>((resolve, reject) => {
    httpServer.close((closeError) =>
      closeError ? reject(closeError) : resolve(),
    );
  });

/**
 * Tracks in-flight responses from listen, and returns `register`, which adds
 * the `SIGTERM` and `SIGINT` listeners that mark `/readyz` draining, drain
 * in-flight responses, call `onShutdown`, then exit.
 */
const createProductionShutdown = (
  httpServer: HttpServer | HttpsServer,
  onShutdown: SkuOnShutdown | undefined,
  markShuttingDown: () => void,
) => {
  const inflight = new Set<ServerResponse>();
  let draining = false;
  let finished = false;
  let deadline: ReturnType<typeof setTimeout> | undefined;

  const removeDrainListeners = () => {
    for (const signal of PROBE_DRAIN_SIGNALS) {
      process.removeListener(signal, onDrainSignal);
    }
  };

  const exit = (code: number) => {
    removeDrainListeners();
    process.exit(code);
  };

  const finish = async () => {
    if (finished) {
      return;
    }
    finished = true;
    // Node 24's close() and closeIdleConnections() leave a socket that has
    // connected and not sent a request. Nothing is in flight now.
    httpServer.closeAllConnections();
    let code = 0;
    try {
      await onShutdown?.();
    } catch (error) {
      console.error(error);
      code = 1;
    }
    clearTimeout(deadline);
    exit(code);
  };

  // Runs before Express, so no middleware has sent headers yet.
  httpServer.prependListener('request', (_req, res) => {
    inflight.add(res);
    // Node 24's close() leaves a socket that has not finished a request open,
    // so a request can still arrive during the drain.
    if (draining) {
      res.setHeader('Connection', 'close');
    }
    res.once('close', () => {
      inflight.delete(res);
      if (!draining) {
        return;
      }
      // A keep-alive socket that finishes after close() otherwise waits out
      // keepAliveTimeout.
      httpServer.closeIdleConnections();
      if (inflight.size === 0) {
        finish().catch((error) => {
          console.error(error);
        });
      }
    });
  });

  function onDrainSignal() {
    if (draining) {
      return;
    }
    draining = true;
    markShuttingDown();

    deadline = setTimeout(() => {
      finished = true;
      exit(1);
    }, SHUTDOWN_DEADLINE_MS);
    deadline.unref();

    for (const res of inflight) {
      if (!res.headersSent) {
        res.setHeader('Connection', 'close');
      }
    }

    httpServer.close();

    if (inflight.size === 0) {
      finish().catch((error) => {
        console.error(error);
      });
    }
  }

  return {
    register: () => {
      for (const signal of PROBE_DRAIN_SIGNALS) {
        process.on(signal, onDrainSignal);
      }
      // The server closes partway through a drain. Keep the listeners until
      // exit so a repeated signal does not fall back to Node's default and
      // kill onShutdown.
      httpServer.once('close', () => {
        if (!draining) {
          removeDrainListeners();
        }
      });
    },
  };
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

  const probes = createProbeMiddleware();
  mountProbeRoutes(serverApp, probes);
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
      cspExtraSources: options.cspExtraSources,
      cspReportTo: options.cspReportTo,
      cspReportOnlyEnabled: options.cspReportOnlyEnabled,
      cspReportOnlyExtraSources: options.cspReportOnlyExtraSources,
      cspReportOnlyReportTo: options.cspReportOnlyReportTo,
      development: options.development,
      onRenderError: options.onRenderError,
    }),
  );

  await new Promise<void>((resolve, reject) => {
    httpServer.once('error', reject);
    httpServer.listen(options.port, resolve);
  });

  httpServer.keepAliveTimeout = PRODUCTION_KEEP_ALIVE_TIMEOUT_MS;
  const shutdown = createProductionShutdown(
    httpServer,
    options.onShutdown,
    probes.markDraining,
  );

  try {
    if (options.onListen) {
      await options.onListen({
        app: serverApp,
        httpServer,
        port: resolveBoundPort(httpServer, options.port),
      });
    }
    assertNoExistingSigtermListeners();
  } catch (error) {
    await closeHttpServer(httpServer);
    throw error;
  }

  probes.markReady();
  shutdown.register();

  return { app: serverApp, httpServer };
};
