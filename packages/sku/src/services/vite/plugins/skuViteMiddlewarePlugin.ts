import type { SkuContext } from '@/context/createSkuContext.js';
import type { Plugin } from 'vite';
import { createRequire } from 'node:module';
import type { ViteRenderFunction } from '@/types/types.js';

const require = createRequire(import.meta.url);

export const skuViteMiddlewarePlugin = (skuContext: SkuContext): Plugin => ({
  name: 'vite-plugin-sku-server-middleware',
  configureServer(server) {
    return () => {
      server.middlewares.use(async (req, res, next) => {
        const host = req.headers.host;
        const hostname = host?.split(':')[0];
        const site =
          skuContext.sites.find((skuSite) => skuSite.host === hostname) || '';

        const isHtml = req.url === '/index.html';
        if (isHtml) {
          const renderEntry = require.resolve('../entries/vite-render.jsx');
          const clientEntry = require.resolve('../entries/vite-client.jsx');

          const { viteRender } = await server.ssrLoadModule(renderEntry);

          const renderedHtml = await (viteRender as ViteRenderFunction)({
            url: req.url,
            site,
            clientEntry,
          });

          const transformedHtml = await server.transformIndexHtml(
            req.url || '/',
            renderedHtml,
          );

          res.writeHead(200, { 'Content-Type': 'text/html' });
          res.end(transformedHtml);
        } else {
          next();
        }
      });
    };
  },
});
