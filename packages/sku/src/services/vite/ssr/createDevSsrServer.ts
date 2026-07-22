import { createRequire } from 'node:module';
import express from 'express';
import { createDebug } from 'obug';
import { createServer as createViteServer, type ViteDevServer } from 'vite';
import type { SkuContext } from '../../../context/createSkuContext.js';
import { createConfig } from '../helpers/config/createConfig.js';
import createServer from '../../../utils/createServer.js';
import { metricsMeasurers } from '../../telemetry/metricsMeasurers.js';
import { SSR_CSS_VIRTUAL_HREF } from '../plugins/ssrCss/constants.js';
import { createSsrRequestContextMiddleware } from './ssrRequestContextMiddleware.js';
import {
  createHtmlRenderMiddleware,
  mountConsumerMiddleware,
  type RenderFunction,
  type SsrServerResult,
} from './ssrServerShared.js';
import type { RenderAssets, SkuSsrMiddleware } from './types.js';

const log = createDebug('sku:vite-ssr:dev-server');
const require = createRequire(import.meta.url);

export const createDevSsrServer = async ({
  skuContext,
  environment,
}: {
  skuContext: SkuContext;
  environment: string;
}): Promise<SsrServerResult & { vite: ViteDevServer }> => {
  // Dev wrapper runs React Refresh preamble before dynamically loading the
  // production client entry (tsdown can reorder static imports in the latter).
  const clientEntry = require.resolve('#entries/vite-ssr-client.dev');
  const serverEntry = require.resolve('#entries/vite-ssr-server');
  const serverApp = express();
  // Shared with static/webpack: self-signed cert when httpsDevServer is true.
  const httpServer = await createServer({
    requestListener: serverApp,
    httpsDevServer: skuContext.httpsDevServer,
    hosts: skuContext.hosts,
  });
  const vite = await createViteServer({
    ...createConfig(skuContext, environment),
    appType: 'custom',
    server: {
      middlewareMode: true,
      // Keep HMR on the same listener (HTTP or HTTPS) sku owns.
      hmr: { server: httpServer },
    },
  });
  const serverModule = (await vite.ssrLoadModule(serverEntry)) as {
    middleware: SkuSsrMiddleware;
    render: RenderFunction;
  };

  // Mount order: request-context → optional config `devServerMiddleware` →
  // server-entry `middleware` → Vite → HTML render. Dev mocks stay outside the
  // production server graph (loaded only here, never from the SSR entry).
  serverApp.use(createSsrRequestContextMiddleware());
  if (skuContext.paths.devServerMiddleware) {
    log(
      'Using dev server middleware at %s',
      skuContext.paths.devServerMiddleware,
    );
    const devServerMiddleware = (
      await import(skuContext.paths.devServerMiddleware)
    ).default;
    if (devServerMiddleware && typeof devServerMiddleware === 'function') {
      devServerMiddleware(serverApp);
      log('Dev server middleware loaded');
    }
  }
  mountConsumerMiddleware(serverModule.middleware, (middleware) =>
    serverApp.use(middleware),
  );
  serverApp.use(vite.middlewares);

  const assets: RenderAssets = {
    bootstrapModules: [`/@vite/client`, `/@fs/${clientEntry}`],
    // Start-only virtual stylesheet (production uses client-manifest CSS).
    css: [SSR_CSS_VIRTUAL_HREF],
    modulePreloads: [],
  };

  const render: RenderFunction = async (...args) => {
    const latestModule = (await vite.ssrLoadModule(serverEntry)) as {
      render: RenderFunction;
    };
    return latestModule.render(...args);
  };

  serverApp.use(
    createHtmlRenderMiddleware({
      render,
      assets,
      cspEnabled: skuContext.cspEnabled,
      cspExtraScriptSrcHosts: skuContext.cspExtraScriptSrcHosts,
      cspReportOnlyEnabled: skuContext.cspReportOnlyEnabled,
      cspReportOnlyExtraScriptSrcHosts:
        skuContext.cspReportOnlyExtraScriptSrcHosts,
      cspReportOnlyReportTo: skuContext.cspReportOnlyReportTo,
      development: true,
      onRenderError: (error) => {
        vite.ssrFixStacktrace(error);
      },
    }),
  );

  await new Promise<void>((resolve, reject) => {
    httpServer.once('error', reject);
    httpServer.listen(skuContext.port.client, resolve);
  });

  // Parity with static middlewarePlugin.configureServer: mark when ready to load.
  if (
    metricsMeasurers.initialPageLoad.isInitialPageLoad &&
    metricsMeasurers.initialPageLoad.openTab
  ) {
    metricsMeasurers.initialPageLoad.mark();
  }

  return { app: serverApp, httpServer, vite };
};
