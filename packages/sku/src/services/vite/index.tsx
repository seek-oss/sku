import { createServer, createBuilder, isRunnableDevEnvironment } from 'vite';

import type { SkuContext } from '../../context/createSkuContext.js';

import { createConfig } from './helpers/config/createConfig.js';
import { cleanTargetDirectory } from '../../utils/buildFileUtils.js';
import { createOutDir } from './helpers/bundleConfig.js';
import { getAppHosts } from '../../context/hosts.js';
import { prerenderConcurrently } from './helpers/prerender/prerenderConcurrently.js';
import allocatePort from '../../utils/allocatePort.js';
import { serverUrls } from '@sku-private/utils';
import express from 'express';
import type { ReactNode, JSX } from 'react';
import { LoadableProvider } from '@sku-lib/vite/loadable';
import { Collector } from '@sku-lib/vite/collector';

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
    const app = express();

    const viteServer = await createServer({
      ...createConfig(skuContext),
      server: { middlewareMode: true },
      appType: 'custom',
      environments: {
        ssr: {
          // by default, modules are run in the same process as the vite server
        },
      },
    });

    // You might need to cast this to RunnableDevEnvironment in TypeScript or
    // use isRunnableDevEnvironment to guard the access to the runner
    const serverEnvironment = viteServer.environments.ssr;

    if (!isRunnableDevEnvironment(serverEnvironment)) {
      throw new Error('Server environment is not runnable dev environment');
    }

    // 3. Load the server entry. import(url) automatically transforms
    //    ESM source code to be usable in Node.js! There is no bundling
    //    required, and provides full HMR support.
    const serverEntry = (
      await serverEnvironment.runner.import(skuContext.paths.serverEntry)
    ).default() as any;

    const { renderApp, renderDocument, onStart, middleware } = serverEntry;

    app.use(viteServer.middlewares);
    if (middleware) {
      app.use(middleware);
    }

    app.use('*', async (req, res, _next) => {
      const url = req.originalUrl;

      // 1. Read index.html
      let template = renderDocument({
        getBodyTags: () =>
          [
            `<script type="module" src="${skuContext.paths.clientEntry}"></script>`,
          ].join('\n'),
        getHeadTags: () => [].join('\n'),
      });

      // 2. Apply Vite HTML transforms. This injects the Vite HMR client,
      //    and also applies HTML transforms from Vite plugins, e.g. global
      //    preambles from @vitejs/plugin-react
      template = await viteServer.transformIndexHtml(url, template);

      const loadableCollector = new Collector({});

      // 4. render the app HTML. This assumes entry-server.js's exported
      //     `render` function calls appropriate framework SSR APIs,
      //    e.g. ReactDOMServer.renderToString()
      const SkuProvider: ({
        children,
      }: {
        children: ReactNode;
      }) => JSX.Element = ({ children }) => (
        <LoadableProvider value={loadableCollector}>
          {children}
        </LoadableProvider>
      );

      const appHtml = await renderApp({
        SkuProvider,
      });

      // 5. Inject the app-rendered HTML into the template.
      const html = template.replace(`<!--ssr-outlet-->`, appHtml);

      // 6. Send the rendered HTML back.
      res.status(200).set({ 'Content-Type': 'text/html' }).end(html);
    });

    app.listen(skuContext.port.server, () => {
      console.log(`Server is running on port ${skuContext.port.server}`);
      console.log(`Client is running on port ${skuContext.port.client}`);
      onStart?.(app);
    });
  },
};
