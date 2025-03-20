import type { SkuContext } from '@/context/createSkuContext.js';
import type { Plugin } from 'vite';
import { createRequire } from 'node:module';
import type { ViteRenderFunction } from '@/types/types.js';
import { getMatchingRoute } from '@/utils/routeMatcher.js';
import debug from 'debug';
import {
  getLanguageFromRoute,
  getRouteWithLanguage,
} from '@/utils/language-utils.js';

const log = debug('sku:middleware:vite');

const require = createRequire(import.meta.url);

export const skuViteMiddlewarePlugin = (skuContext: SkuContext): Plugin => ({
  name: 'vite-plugin-sku-server-middleware',
  configureServer(server) {
    log('Configuring server middleware');
    server.middlewares.use(async (req, res, next) => {
      log('Handling request:', req.url);
      if (!req.url) {
        // TODO: This should probably just call next() instead of throwing an error
        throw new Error(
          'Internal error occurred. No URL Found when handling middleware.',
        );
      }
      const host = req.headers.host;
      const hostname = host?.split(':')[0];

      if (!hostname) {
        // TODO: I don't think this should be required
        throw new Error(
          'Internal error occurred. No hostname found when handling middleware. Host header required.',
        );
      }
      const site =
        skuContext.sites.find((skuSite) => skuSite.host === hostname) ||
        skuContext.sites[0];

      if (!site) {
        // TODO: If there are no sites we might want to allow this, otherwise likely needs to call next()
        throw new Error(
          'Internal error occurred. No site found when handling middleware. Site required.',
        );
      }

      if (!req.url) {
        // TODO: Consider defaulting this value. But it's should be guaranteed for all requests. Something very wrong has occurred if it does not exist.
        throw new Error(
          'Internal error occurred. No URL Found when handling middleware.',
        );
      }

      const matchingRoute = getMatchingRoute({
        hostname: host,
        path: req.url,
        routes: skuContext.routes,
        sites: skuContext.sites,
      });

      if (!matchingRoute) {
        next();
        return;
      }

      log('Matching route found:', matchingRoute);

      const language = getLanguageFromRoute(req.url, matchingRoute, skuContext);

      const renderEntry = require.resolve('../entries/vite-render.js');
      const clientEntry = require.resolve('../entries/vite-client.js');

      const { viteRender } = await server.ssrLoadModule(renderEntry);

      const renderedHtml = await (viteRender as ViteRenderFunction)({
        environment: 'development',
        language,
        route: getRouteWithLanguage(matchingRoute.route, language),
        routeName: matchingRoute.name,
        site: site.name,
        clientEntry,
      });

      const transformedHtml = await server.transformIndexHtml(
        req.url || '/',
        renderedHtml,
      );

      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(transformedHtml);
    });
  },
});
