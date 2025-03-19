import type { SkuContext } from '@/context/createSkuContext.js';
import type { Plugin } from 'vite';
import { createRequire } from 'node:module';
import type { ViteRenderFunction } from '@/types/types.js';
import { getStartRoutes } from '@/services/webpack/config/plugins/createHtmlRenderPlugin.js';
import routeMatcher from '@/utils/routeMatcher.js';

const require = createRequire(import.meta.url);

export const skuViteMiddlewarePlugin = (skuContext: SkuContext): Plugin => ({
  name: 'vite-plugin-sku-server-middleware',
  configureServer(server) {
    return () => {
      server.middlewares.use(async (req, res, next) => {
        const isHtml = req.url === '/index.html';
        if (!isHtml) {
          return next();
        }

        const routes = getStartRoutes(skuContext);
        const matchingRoute = routes.find(({ route }) =>
          routeMatcher(route)(req.url ?? ''),
        );

        if (!matchingRoute) {
          return next();
        }

        const renderEntry = require.resolve('../entries/vite-render.js');
        const clientEntry = require.resolve('../entries/vite-client.js');

        const { viteRender } = await server.ssrLoadModule(renderEntry);

        const renderedHtml = await (viteRender as ViteRenderFunction)({
          ...matchingRoute,
          clientEntry,
        });

        const transformedHtml = await server.transformIndexHtml(
          req.url || '/',
          renderedHtml,
        );

        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(transformedHtml);
      });
    };
  },
});
