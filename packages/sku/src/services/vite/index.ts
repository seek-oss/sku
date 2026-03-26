import path from 'node:path';
import http from 'node:http';
import express from 'express';
import type { ReactNode } from 'react';
import type { ChunkExtractor } from '@loadable/server';
import { createServer, createBuilder, isRunnableDevEnvironment } from 'vite';

import type { SkuContext } from '../../context/createSkuContext.js';
import type { RenderCallbackParams } from '../../types/types.js';

import { createConfig } from './helpers/config/createConfig.js';
import { cleanTargetDirectory } from '../../utils/buildFileUtils.js';
import { createOutDir } from './helpers/bundleConfig.js';
import { getAppHosts } from '../../context/hosts.js';
import { prerenderConcurrently } from './helpers/prerender/prerenderConcurrently.js';
import allocatePort from '../../utils/allocatePort.js';
import { serverUrls } from '@sku-private/utils';
import { openBrowser } from '../../openBrowser.js';
import createCSPHandler from '../webpack/entry/csp.js';

export const viteService = {
  build: async (skuContext: SkuContext) => {
    const outDir = createOutDir(skuContext.paths.target);
    const builder = await createBuilder(createConfig(skuContext));

    // builds all environments in the order they are defined in the config
    await builder.buildApp();

    if (skuContext.routes) {
      await prerenderConcurrently(skuContext);
    }
    await cleanTargetDirectory(outDir.ssg, true);
    await cleanTargetDirectory(outDir.join('.vite'), true);
  },
  start: async ({
    skuContext,
    environment,
  }: {
    skuContext: SkuContext;
    environment: string;
  }) => {
    const server = await createServer(createConfig(skuContext, environment));

    const availablePort = await allocatePort({
      port: skuContext.port.client,
      strictPort: skuContext.port.strictPort,
    });

    await server.listen(availablePort);

    const hosts = getAppHosts(skuContext);

    console.log('Starting development server...');
    const urls = serverUrls({
      hosts,
      port: availablePort,
      initialPath: skuContext.initialPath,
      https: skuContext.httpsDevServer,
    });

    if (skuContext.listUrls) {
      urls.printAll();
    } else {
      urls.print();
    }

    server.bindCLIShortcuts({ print: true });
  },

  startSsr: async (skuContext: SkuContext) => {
    const localhost = '0.0.0.0';

    const serverPort = await allocatePort({
      port: skuContext.port.server,
      host: localhost,
      strictPort: skuContext.port.strictPort,
    });

    const app = express();
    const httpServer = http.createServer(app);

    const baseConfig = createConfig(skuContext);

    const vite = await createServer({
      ...baseConfig,
      appType: 'custom',
      server: {
        ...baseConfig.server,
        middlewareMode: { server: httpServer },
        host: localhost,
        port: serverPort,
        strictPort: skuContext.port.strictPort,
      },
    });

    app.use(vite.middlewares);

    if (skuContext.paths.devServerMiddleware) {
      const devServerMiddleware = (
        await import(skuContext.paths.devServerMiddleware)
      ).default;
      if (devServerMiddleware && typeof devServerMiddleware === 'function') {
        devServerMiddleware(app);
      }
    }

    const ssrEnvironment = vite.environments.ssr;
    if (!isRunnableDevEnvironment(ssrEnvironment)) {
      throw new TypeError(
        'Vite SSR dev environment is not a RunnableDevEnvironment; cannot load the server entry.',
      );
    }

    const serverEntryRelative = path
      .relative(process.cwd(), skuContext.paths.serverEntry)
      .split(path.sep)
      .join('/');
    const serverEntrySpecifier = serverEntryRelative.startsWith('.')
      ? serverEntryRelative
      : `./${serverEntryRelative}`;

    const serverModule =
      await ssrEnvironment.runner.import(serverEntrySpecifier);
    const serverFactory = (
      serverModule as { default?: (opts: { publicPath: string }) => unknown }
    ).default;

    if (typeof serverFactory !== 'function') {
      throw new TypeError(
        'Server entry must default-export a function `(options) => ({ renderCallback, ... })`',
      );
    }

    const serverOptions = serverFactory({
      publicPath: skuContext.paths.publicPath,
    }) as {
      middleware?: express.RequestHandler | express.RequestHandler[];
      onStart?: (app: express.Express) => void;
      renderCallback: (
        params: RenderCallbackParams,
        ...args: Parameters<express.RequestHandler>
      ) => void;
    };

    const { middleware, onStart, renderCallback } = serverOptions;

    if (middleware) {
      app.use(middleware);
    }

    const clientEntryUrl = `/${path
      .relative(process.cwd(), skuContext.paths.clientEntry)
      .split(path.sep)
      .join('/')}`;

    const stubExtractor = {} as ChunkExtractor;

    const SkuProvider = ({ children }: { children: ReactNode }) => children;

    app.get('*', (req, res, next) => {
      let cspHandler: ReturnType<typeof createCSPHandler> | undefined;

      if (skuContext.cspEnabled) {
        cspHandler = createCSPHandler({
          extraHosts: [
            skuContext.paths.publicPath,
            ...skuContext.cspExtraScriptSrcHosts,
          ],
          isDevelopment: true,
        });
      }

      const getBodyTags = () =>
        [
          `
          <script type="module">
              import RefreshRuntime from "/@react-refresh"
              RefreshRuntime.injectIntoGlobalHook(window)
              window.$RefreshReg$ = () => {}
              window.$RefreshSig$ = () => (type) => type
              window.__vite_plugin_react_preamble_installed__ = true
          </script>
          `,
          '<script type="module" src="/@vite/client"></script>',
          `<script type="module" src="${clientEntryUrl}"></script>`,
        ].join('\n');

      const params = {
        SkuProvider,
        addLanguageChunk: () => {},
        getBodyTags,
        getHeadTags: () => '',
        flushHeadTags: () => '',
        extractor: stubExtractor,
        registerScript: cspHandler?.registerScript,
        ...(cspHandler
          ? { createUnsafeNonce: cspHandler.createUnsafeNonce }
          : {}),
      } as RenderCallbackParams;

      renderCallback(params, req, res, next);
    });

    await new Promise<void>((resolve, reject) => {
      httpServer.once('error', reject);
      httpServer.listen(serverPort, localhost, () => resolve());
    });

    if (typeof onStart === 'function') {
      onStart(app);
    }

    const hosts = getAppHosts(skuContext);

    console.log('Starting development server...');
    const urls = serverUrls({
      hosts,
      port: serverPort,
      initialPath: skuContext.initialPath,
      https: skuContext.httpsDevServer,
    });

    if (skuContext.listUrls) {
      urls.printAll();
    } else {
      urls.print();
    }

    await openBrowser(urls.first());
  },
};
