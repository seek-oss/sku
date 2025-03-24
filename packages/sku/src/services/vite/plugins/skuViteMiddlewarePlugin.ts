import type { SkuContext } from '@/context/createSkuContext.js';
import type { Plugin } from 'vite';
import { createRequire } from 'node:module';
import type { ViteRenderFunction } from '@/types/types.js';
import debug from 'debug';

const require = createRequire(import.meta.url);

const log = debug('sku:vite-middleware-plugin');

export const skuViteMiddlewarePlugin = (skuContext: SkuContext): Plugin => ({
  name: 'vite-plugin-sku-server-middleware',
  async configureServer(server) {
    if (skuContext.useDevServerMiddleware) {
      log(
        'Using dev server middleware at %s',
        skuContext.paths.devServerMiddleware,
      );
      const devServerMiddleware = (
        await import(skuContext.paths.devServerMiddleware)
      ).default;
      if (devServerMiddleware && typeof devServerMiddleware === 'function') {
        devServerMiddleware(server);
        log('Dev server middleware loaded');
      }
    }

    return () => {
      server.middlewares.use(async (req, res, next) => {
        const host = req.headers.host;
        const hostname = host?.split(':')[0];
        const site =
          skuContext.sites.find((skuSite) => skuSite.host === hostname) ||
          skuContext.sites[0] ||
          '';

        const isHtml = req.url === '/index.html';
        if (isHtml) {
          const renderEntry = require.resolve('../entries/vite-render.jsx');
          const clientEntry = require.resolve('../entries/vite-client.jsx');

          const { viteRender } = await server.ssrLoadModule(renderEntry);

          const url = req.originalUrl || req.url || '/';

          const renderedHtml = await (viteRender as ViteRenderFunction)({
            url,
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
