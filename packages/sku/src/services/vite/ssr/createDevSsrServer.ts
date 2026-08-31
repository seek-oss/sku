import { createRequire } from 'node:module';
import express, { type Express, type RequestHandler } from 'express';
import { createDebug } from 'obug';
import { createServer as createViteServer, type ViteDevServer } from 'vite';
import type { SkuContext } from '../../../context/createSkuContext.js';
import { getAppHosts } from '../../../context/hosts.js';
import { createConfig } from '../helpers/config/createConfig.js';
import createServer from '../../../utils/createServer.js';
import { metricsMeasurers } from '../../telemetry/metricsMeasurers.js';
import { SSR_CSS_VIRTUAL_HREF } from '../plugins/ssrCss/constants.js';
import { createSsrRequestContextMiddleware } from './ssrRequestContextMiddleware.js';
import {
  createHtmlRenderMiddleware,
  mountConsumerMiddleware,
  resolveBoundPort,
  type SsrServerModule,
  type SsrServerResult,
} from './ssrServerShared.js';
import type { RenderAssets, SkuMiddleware } from './types.js';

const log = createDebug('sku:vite-ssr:dev-server');
const require = createRequire(import.meta.url);

export const mountStartSsrMiddleware = ({
  app,
  viteMiddlewares,
  loadDevServerMiddleware,
  consumerMiddleware,
  htmlMiddleware,
}: {
  app: Express;
  viteMiddlewares: RequestHandler;
  loadDevServerMiddleware?: (app: Express) => void;
  consumerMiddleware?: SkuMiddleware;
  htmlMiddleware: RequestHandler;
}): void => {
  app.use(createSsrRequestContextMiddleware());
  app.use(viteMiddlewares);
  loadDevServerMiddleware?.(app);
  mountConsumerMiddleware(consumerMiddleware, (middleware) =>
    app.use(middleware),
  );
  app.use(htmlMiddleware);
};

export const createDevSsrServer = async ({
  skuContext,
  environment,
}: {
  skuContext: SkuContext;
  environment: string;
}): Promise<SsrServerResult & { vite: ViteDevServer }> => {
  // Dev wrapper runs React Refresh preamble before dynamically loading the
  // production client entry (tsdown can reorder static imports in the latter).
  const clientEntry = require.resolve('#entries/ssr-client.dev');
  const serverEntry = require.resolve('#entries/ssr-server');
  const serverApp = express();

  if (skuContext.expressTrustProxy) {
    // Hop count 1 (not boolean true) — safer single-hop proxy case.
    serverApp.set('trust proxy', 1);
  }

  const httpServer = await createServer({
    requestListener: serverApp,
    httpsDevServer: skuContext.httpsDevServer,
    hosts: getAppHosts(skuContext),
  });

  const vite = await createViteServer({
    ...createConfig(skuContext, environment),
    appType: 'custom',
    server: {
      middlewareMode: true,
      hmr: { server: httpServer },
    },
  });

  const serverModule = (await vite.ssrLoadModule(
    serverEntry,
  )) as SsrServerModule;

  let loadDevServerMiddleware: ((app: Express) => void) | undefined;
  if (skuContext.paths.devServerMiddleware) {
    log(
      'Using dev server middleware at %s',
      skuContext.paths.devServerMiddleware,
    );
    const devServerMiddleware = (
      await import(skuContext.paths.devServerMiddleware)
    ).default;
    if (devServerMiddleware && typeof devServerMiddleware === 'function') {
      loadDevServerMiddleware = devServerMiddleware;
      log('Dev server middleware loaded');
    }
  }

  const assets: RenderAssets = {
    bootstrapModules: [`/@vite/client`, `/@fs/${clientEntry}`],
    // Start-only virtual stylesheet (production uses client-manifest CSS).
    css: [SSR_CSS_VIRTUAL_HREF],
    modulePreloads: [],
  };

  const render: SsrServerModule['render'] = async (...args) => {
    const latestModule = (await vite.ssrLoadModule(
      serverEntry,
    )) as SsrServerModule;
    return latestModule.render(...args);
  };

  mountStartSsrMiddleware({
    app: serverApp,
    viteMiddlewares: vite.middlewares,
    loadDevServerMiddleware,
    consumerMiddleware: serverModule.middleware,
    htmlMiddleware: createHtmlRenderMiddleware({
      render,
      assets,
      cspEnabled: skuContext.cspEnabled,
      cspExtraScriptSrcHosts: skuContext.cspExtraScriptSrcHosts,
      cspReportTo: skuContext.cspReportTo,
      cspReportOnlyEnabled: skuContext.cspReportOnlyEnabled,
      cspReportOnlyExtraScriptSrcHosts:
        skuContext.cspReportOnlyExtraScriptSrcHosts,
      cspReportOnlyReportTo: skuContext.cspReportOnlyReportTo,
      development: true,
      onRenderError: (error) => {
        vite.ssrFixStacktrace(error);
      },
    }),
  });

  const listenPort = skuContext.port.client;
  await new Promise<void>((resolve, reject) => {
    httpServer.once('error', reject);
    httpServer.listen(listenPort, resolve);
  });

  // Call once from the initial server entry — do not re-fire on HMR reload.
  if (serverModule.onListen) {
    try {
      await serverModule.onListen({
        app: serverApp,
        httpServer,
        port: resolveBoundPort(httpServer, listenPort),
      });
    } catch (error) {
      await Promise.all([
        vite.close(),
        new Promise<void>((resolve, reject) => {
          httpServer.close((closeError) =>
            closeError ? reject(closeError) : resolve(),
          );
        }),
      ]);
      throw error;
    }
  }

  // Parity with static middlewarePlugin.configureServer: mark when ready to load.
  if (
    metricsMeasurers.initialPageLoad.isInitialPageLoad &&
    metricsMeasurers.initialPageLoad.openTab
  ) {
    metricsMeasurers.initialPageLoad.mark();
  }

  return { app: serverApp, httpServer, vite };
};
