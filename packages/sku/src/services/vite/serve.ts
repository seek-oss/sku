import fs from 'node:fs/promises';
import path from 'node:path';
import { Transform } from 'node:stream';
import { setTimeout } from 'node:timers/promises';
import express from 'express';
import type { ViteDevServer } from 'vite';
import crypto from 'node:crypto';
import { createServer as createHttpServer, type Server } from 'http';

import { createViteConfig } from '@/services/vite/createConfig.js';
import type { SkuContext } from '@/context/createSkuContext.js';
import { getClosingHtml, getOpeningHtml } from '@/services/vite/createIndex.js';
import { createCollector } from '@/services/vite/preload/collector.js';
import { createRequire } from 'node:module';

const isTest = process.env.VITEST;

const base = process.env.BASE || '/';

const resolve = (p: string) => path.resolve(process.cwd(), p);
const require = createRequire(import.meta.url);

type CreateServerOptions = {
  root?: string;
  isProduction?: boolean;
  hmrPort?: any;
  skuContext: SkuContext;
};

export const createServer: (options: CreateServerOptions) => Promise<{
  app: Server;
  vite: ViteDevServer | undefined;
}> = async ({
  root = process.cwd(),
  isProduction = process.env.NODE_ENV === 'production',
  skuContext,
}) => {
  try {
    const manifest = isProduction
      ? JSON.parse(
          await fs.readFile(resolve('./dist/.vite/manifest.json'), 'utf-8'),
        )
      : null;

    // Create http server
    const app = express();

    const server = createHttpServer(app);

    // Add Vite or respective production middlewares
    let vite: ViteDevServer | undefined;
    if (!isProduction) {
      const { createServer } = await import('vite');

      vite = await createServer({
        ...createViteConfig({ skuContext, configType: 'ssr' }),
        root,
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

    // Serve HTML
    app.use('*', async (req, res) => {
      try {
        const url = req.originalUrl.replace(base, '');

        let render;
        let viteHtml = '';
        const nonce = crypto.randomBytes(16).toString('base64');
        if (!isProduction && vite) {
          // Always read fresh template in development
          let html = getOpeningHtml({
            title: 'Sku Project',
            headTags: '<!-- head tags -->',
          });

          html += '<!-- app tags -->';

          const clientEntry = require.resolve('./entries/vite-client.jsx');

          html += getClosingHtml({
            bodyTags: `<script type="module" src="${clientEntry}"></script>\n<!-- body tags -->`,
          });

          viteHtml = (await vite.transformIndexHtml(url, html)) || '';

          render = (await vite.ssrLoadModule(skuContext.paths.serverEntry))
            .render;
        } else {
          let html = getOpeningHtml({
            title: 'Sku Project',
            headTags: '<!-- head tags -->',
          });

          html += '<!-- app tags -->';

          html += getClosingHtml({
            bodyTags: `<!-- body tags -->`,
          });

          viteHtml = html;

          const serverEntryFile = 'server.js';
          render = (await import(resolve(`./dist/server/${serverEntryFile}`)))
            .render;
        }

        // res.setHeader(
        //   'Content-Security-Policy',
        //   `script-src 'self' 'nonce-${nonce}'; style-src 'self' 'nonce-${nonce}';`,
        // );

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
            await setTimeout(1000);
          }
        }

        const { pipe } = await render({
          url,
          loadableCollector,
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

              transformStream.on('finish', () => {
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
    });

    return { app: server, vite };
  } catch (e: any) {
    console.error(e);
    return { app: createHttpServer(), vite: undefined };
  }
};
