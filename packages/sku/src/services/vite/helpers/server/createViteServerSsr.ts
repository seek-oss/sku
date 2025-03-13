import path from 'node:path';
import { Transform } from 'node:stream';
import express, { type RequestHandler } from 'express';
import type { Manifest, ViteDevServer } from 'vite';
import crypto from 'node:crypto';
import { createServer as createHttpServer } from 'node:http';
import { readFile } from 'node:fs/promises';

import { createViteConfig } from '@/services/vite/helpers/createConfig.js';
import type { SkuContext } from '@/context/createSkuContext.js';

import { createSsrHtml } from '@/services/vite/helpers/html/createSsrHtml.js';
import { createCollector } from '@/services/vite/loadable/collector.js';
import skuViteHMRTelemetryPlugin from '@/services/vite/plugins/skuViteHMRTelemetry.js';

const base = process.env.BASE || './';

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
    const manifest = isProduction
      ? JSON.parse(
          await readFile(resolve('./dist/.vite/manifest.json'), 'utf-8'),
        )
      : null;

    let vite: ViteDevServer | undefined;
    if (!isProduction) {
      const { createServer: createViteSever } = await import('vite');

      vite = await createViteSever({
        ...createViteConfig({
          skuContext,
          configType: 'ssr',
          plugins: [
            skuViteHMRTelemetryPlugin({
              target: 'node',
              type: 'ssr',
            }),
          ],
        }),
        server: {
          middlewareMode: true,
          hmr: true,
          allowedHosts: skuContext.sites
            .map(({ host }) => host || false)
            .filter((host) => typeof host === 'string'),
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

    app.use('*', createRequestHandler({ skuContext, vite, manifest }));

    return server;
  } catch (e: any) {
    console.error(e);
    return createHttpServer();
  }
};

const createRequestHandler =
  ({
    skuContext,
    manifest,
    vite,
  }: {
    skuContext: SkuContext;
    manifest: Manifest;
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

      const loadableCollector = createCollector({
        externalJsFiles: [],
        manifest,
        nonce,
      });

      // Not going work locally in Chrome unless you have a HTTP/2 supported proxy in front, use Firefox to pick up 103 Early Hints over HTTP/1.1 without TLS
      // https://developer.chrome.com/docs/web-platform/early-hints
      // Also services like cloudflare already handles this for you
      // https://developers.cloudflare.com/cache/advanced-configuration/early-hints/
      const links = loadableCollector.getAllLinks();

      if (req.headers['sec-fetch-mode'] === 'navigate') {
        if (links) {
          res.writeEarlyHints({
            link: loadableCollector.getAllLinks(),
          });
        }
      }

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

            const tags = loadableCollector.getAllPreloads();
            const [startHtml, endHtml] = viteHtml.split('<!-- app tags -->');

            res.write(startHtml.replace('<!-- head tags -->', tags));

            const transformStream = new Transform({
              transform(chunk, encoding, callback) {
                res.write(chunk, encoding);
                callback();
              },
            });

            transformStream.on('finish', async () => {
              const bodyTags = loadableCollector.getAllScripts();
              res.end(endHtml.replace('<!-- body tags -->', bodyTags));
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
