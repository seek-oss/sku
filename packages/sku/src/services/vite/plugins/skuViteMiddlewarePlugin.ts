import type { SkuContext } from '@/context/createSkuContext.js';
import type { Plugin } from 'vite';
import { createRequire } from 'node:module';
import path from 'node:path';
import resolveSync from 'resolve-from';

const require = createRequire(import.meta.url);

export const skuViteMiddlewarePlugin = (skuContext: SkuContext): Plugin => ({
  name: 'vite-plugin-sku-server-middleware',
  configureServer(server) {
    return () => {
      server.middlewares.use(async (req, res, next) => {
        const host = req.headers.host; // This includes the hostname and port
        const hostname = host?.split(':')[0];
        const site =
          skuContext.sites.find((skuSite) => skuSite.host === hostname) || '';
        const isHtml = req.url === '/index.html';
        if (isHtml) {
          const resolveFromSku = (...paths: string[]) => {
            const skuRoot = path.dirname(resolveSync('.', 'sku'));
            return path.join(skuRoot, ...paths);
          };

          const render = (
            await server.ssrLoadModule(
              resolveFromSku('./src/services/vite/entries/vite-render.tsx'),
            )
          ).viteRender;

          const clientEntry = require.resolve('../entries/vite-client.jsx');

          const html = await render({ url: req.url!, site, clientEntry });

          const viteHtml = await server.transformIndexHtml(
            req.url || '/',
            html,
          );

          res.writeHead(200, { 'Content-Type': 'text/html' });
          res.end(viteHtml);
        } else {
          next();
        }
      });
    };
  },
});
