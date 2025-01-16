import { createViteConfig } from '@/services/vite/createConfig.js';
import { SkuContext } from '@/context/createSkuContext.js';
import { createServer } from 'vite';
import clientContextKey from '@/entry/clientContextKey.js';
import serializeJavascript from 'serialize-javascript';
import type { Plugin } from 'vite';
import { createDefaultHtmlIndex } from '@/services/vite/createIndex.js';

export const serializeConfig = (config: object) =>
  `<script id="${clientContextKey}" type="application/json">${serializeJavascript(
    config,
    { isJSON: true },
  )}</script>`;

const SkuViteMiddleware = (skuContext: SkuContext): Plugin => ({
  name: 'sku-vite-server-middleware',
  configureServer(server) {
    return () => {
      server.middlewares.use(async (req, res, next) => {
        const host = req.headers['host']; // This includes the hostname and port
        const hostname = host?.split(':')[0];
        const site = skuContext.sites.find((site) => site.host === hostname);
        const isHtml = req.url === '/index.html';
        if (isHtml && site) {
          const { skuConfig } = skuContext;
          const { clientEntry } = skuConfig;

          // TODO: fix the title here.
          const headTags = `<title>Sku Project</title>\n`;

          const indexHtml = '';

          const html = await server.transformIndexHtml(
            req.url || '/',
            indexHtml,
          );

          res.writeHead(200, { 'Content-Type': 'text/html' });
          res.end(html);
        } else {
          next();
        }
      });
    };
  },
});

export const createViteServer = async (skuContext: SkuContext) => {
  const base = process.env.BASE || '/';
  const root = process.cwd();

  const server = await createServer({
    ...createViteConfig({
      skuContext,
      plugins: skuContext.sites ? [SkuViteMiddleware(skuContext)] : [],
    }),
    root,
    base,
  });

  return server;
};
