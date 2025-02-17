import path from 'node:path';
import { Transform } from 'node:stream';
import express, { type RequestHandler } from 'express';
import type { ViteDevServer } from 'vite';
import crypto from 'node:crypto';
import { createServer as createHttpServer } from 'node:http';

import { createViteConfig } from '@/services/vite/helpers/createConfig.js';
import type { SkuContext } from '@/context/createSkuContext.js';

import { createSsrHtml } from '@/services/vite/helpers/html/createSsrHtml.js';

const base = process.env.BASE || '/';

const resolve = (p: string) => path.resolve(process.cwd(), p);

type CreateServerOptions = {
  skuContext: SkuContext;
};

export const createViteServerSsr = async ({
  skuContext,
}: CreateServerOptions) => {
  const isProduction = process.env.NODE_ENV === 'production';
  try {
    const app = express();
    const server = createHttpServer(app);

    let vite: ViteDevServer | undefined;
    if (!isProduction) {
      const { createServer: createViteSever } = await import('vite');

      vite = await createViteSever({
        ...createViteConfig({ skuContext, configType: 'ssr' }),
        server: {
          middlewareMode: true,
          hmr: true,
        },
        appType: 'custom',
        base,
      });

      app.use(vite.middlewares);
    } else {
      const compression = (await import('compression')).default;
      const sirv = (await import('sirv')).default;
      app.use(compression());
      app.use(base, sirv(resolve('./dist'), { extensions: [] }));
    }

    app.use('*', createRequestHandler({ skuContext, vite }));

    return server;
  } catch (e: any) {
    console.error(e);
    return createHttpServer();
  }
};

const createRequestHandler =
  ({
    skuContext,
    vite,
  }: {
    skuContext: SkuContext;
    vite: ViteDevServer | undefined;
  }): RequestHandler =>
  async (req, res) => {
    const isProduction = process.env.NODE_ENV === 'production';
    try {
      const host = req.headers.host; // This includes the hostname and port
      const hostname = host?.split(':')[0];
      const site =
        skuContext.sites.find((skuSite) => skuSite.host === hostname) || '';

      const url = req.originalUrl.replace(base, '');

      const nonce = crypto.randomBytes(16).toString('base64');
      const isDev = !isProduction && vite;
      // TODO: Get this from the sku config path.
      const serverEntryFile = 'server.js';
      const render = isDev
        ? (await vite.ssrLoadModule(skuContext.paths.serverEntry)).default
        : (await import(resolve(`./dist/server/${serverEntryFile}`))).default;
      const viteHtml = await createSsrHtml({
        isDev: Boolean(isDev),
        vite,
        render,
        url,
        site,
      });

      let didError = false;

      const renderContext = {};

      const { pipe } = await render.render({
        url,
        renderContext,
        site,
        options: {
          nonce,
          onShellError() {
            res.status(500);
            res.set({ 'Content-Type': 'text/html' });
            res.send('<h1>Something went wrong</h1>');
          },
          onShellReady() {
            res.status(didError ? 500 : 200);
            res.set('Content-Type', 'text/html');

            const [startHtml, endHtml] = viteHtml.split('<!-- app tags -->');

            res.write(startHtml);

            const transformStream = new Transform({
              transform(chunk, encoding, callback) {
                res.write(chunk, encoding);
                callback();
              },
            });

            transformStream.on('finish', async () => {
              res.end(endHtml);
            });

            pipe(transformStream);
          },
          onError(error: any) {
            didError = true;
            console.error(error);
          },
          onAllReady() {
            console.log('onAllReady');
          },
        },
      });
    } catch (e: any) {
      vite?.ssrFixStacktrace(e);
      console.log(e.stack);
      res.status(500).end(e.stack);
    }
  };
