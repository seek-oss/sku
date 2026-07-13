import path from 'node:path';
import { createRequire } from 'node:module';
import express from 'express';
import { createServer as createViteServer, type ViteDevServer } from 'vite';
import type { SkuContext } from '../../../context/createSkuContext.js';
import { createConfig } from '../helpers/config/createConfig.js';
import createServer from '../../../utils/createServer.js';
import { createSsrRequestContextMiddleware } from './ssrRequestContextMiddleware.js';
import {
  createHtmlRenderMiddleware,
  mountConsumerMiddleware,
  type RenderFunction,
  type SsrServerResult,
} from './ssrServerShared.js';
import type { RenderAssets, SkuApp } from './types.js';

const require = createRequire(import.meta.url);

export const createDevSsrServer = async ({
  skuContext,
  environment,
}: {
  skuContext: SkuContext;
  environment: string;
}): Promise<SsrServerResult & { vite: ViteDevServer }> => {
  const clientEntry = require.resolve('#entries/vite-ssr-client');
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
    app: SkuApp;
    render: RenderFunction;
  };

  serverApp.use(createSsrRequestContextMiddleware());
  mountConsumerMiddleware(serverModule.app.middleware, (middleware) =>
    serverApp.use(middleware),
  );
  serverApp.use(vite.middlewares);

  const base = skuContext.publicPath;
  const languages = (skuContext.languages ?? []).map(({ name }) => name);
  const assets: RenderAssets = {
    bootstrapModules: [
      path.posix.join(base, '@vite/client'),
      `${base}@fs/${clientEntry}`,
    ],
    css: [],
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
      languages,
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

  return { app: serverApp, httpServer, vite };
};
