import fs from 'node:fs/promises';
import path from 'node:path';
import { Transform } from 'node:stream';
import { setTimeout } from 'node:timers/promises';
import express from 'express';
import type { ViteDevServer } from 'vite';
import { createChunkCollector } from 'vite-preload';
import crypto from 'node:crypto';

import { createViteConfig } from '@/services/vite/createConfig.js';
import type { SkuContext } from '@/context/createSkuContext.js';

const isTest = process.env.VITEST;

// Constants
const base = process.env.BASE || '/';

const resolve = (p: string) => path.resolve(process.cwd(), p);

type CreateServerOptions = {
  root?: string;
  isProduction?: boolean;
  hmrPort?: any;
  skuContext: SkuContext;
};

export const createServer: (options: CreateServerOptions) => Promise<{
  app: express.Express;
  vite: ViteDevServer | undefined;
}> = async ({
  root = process.cwd(),
  isProduction = process.env.NODE_ENV === 'production',
  hmrPort,
  skuContext,
}) => {
  try {
    // Cached production assets
    const templateHtml = isProduction
      ? await fs.readFile(resolve('./dist/client/index.html'), 'utf-8')
      : '';
    const manifest = isProduction
      ? JSON.parse(
          await fs.readFile(
            resolve('./dist/client/.vite/manifest.json'),
            'utf-8',
          ),
        )
      : undefined;

    // Create http server
    const app = express();

    // Add Vite or respective production middlewares
    let vite: ViteDevServer | undefined;
    if (!isProduction) {
      const { createServer } = await import('vite');
      vite = await createServer({
        ...createViteConfig({ skuContext }),
        root,
        server: { middlewareMode: true },
        appType: 'custom',
        base,
      });
      app.use(vite.middlewares);
    } else {
      const compression = (await import('compression')).default;
      const sirv = (await import('sirv')).default;
      app.use(compression());
      app.use(base, sirv(resolve('./dist/client'), { extensions: [] }));
    }

    // Serve HTML
    app.use('*', async (req, res) => {
      try {
        const url = req.originalUrl.replace(base, '');

        let template;
        let render;
        if (!isProduction && vite) {
          // Always read fresh template in development
          template = await fs.readFile(resolve('./index.html'), 'utf-8');
          template = await vite.transformIndexHtml(url, template);
          render = (await vite.ssrLoadModule(skuContext.paths.serverEntry))
            .render;
        } else {
          template = templateHtml;
          // skuContext.paths.serverEntry.split('/').pop() || fix this by removing the mimetype.
          const serverEntryFile = 'server.js';
          render = (await import(resolve(`./dist/server/${serverEntryFile}`)))
            .render;
        }

        const nonce = crypto.randomBytes(16).toString('base64');
        res.setHeader(
          'Content-Security-Policy',
          `script-src 'self' 'nonce-${nonce}'; style-src 'self' 'nonce-${nonce}';`,
        );

        let didError = false;

        const collector = createChunkCollector({
          manifest,
          preloadAssets: true,
          preloadFonts: true,
          nonce,
        });

        // Not gonna work locally in Chrome unless you have a HTTP/2 supported proxy in front, use Firefox to pick up 103 Early Hints over HTTP/1.1 without TLS
        // https://developer.chrome.com/docs/web-platform/early-hints
        // Also services like cloudflare already handles this for you
        // https://developers.cloudflare.com/cache/advanced-configuration/early-hints/
        if (req.headers['sec-fetch-mode'] === 'navigate') {
          res.writeEarlyHints({
            link: collector.getLinkHeaders(),
          });
          await setTimeout(1000);
        }

        const [head, rest] = template.split(`<!--app-html-->`);

        const { pipe } = await render({
          url,
          collector,
          options: {
            nonce,
            onShellError() {
              res.status(500);
              res.set({ 'Content-Type': 'text/html' });
              res.send('<h1>Something went wrong</h1>');
            },
            onShellReady() {
              console.log('onShellReady');

              res.status(didError ? 500 : 200);
              res.set('Content-Type', 'text/html');
              const links = collector.getLinkHeaders();
              res.append('link', links);

              const modules = collector.getSortedModules();

              console.log('Modules used', modules);

              const tags = collector.getTags();

              res.write(
                head
                  .replaceAll('%NONCE%', nonce)
                  .replace('<!--app-head-->', `${tags}`),
              );

              const transformStream = new Transform({
                transform(chunk, encoding, callback) {
                  res.write(chunk, encoding);
                  console.log('Chunk', chunk.length);
                  callback();
                },
              });

              transformStream.on('finish', () => {
                res.end(rest);
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

    return { app, vite };
  } catch (e: any) {
    console.error(e);
    return { app: express(), vite: undefined };
  }
};
