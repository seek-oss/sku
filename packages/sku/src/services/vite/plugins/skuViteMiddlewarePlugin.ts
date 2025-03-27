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
import { metricsMeasurers } from '@/services/telemetry/metricsMeasurers.js';
import createCSPHandler from '@/services/webpack/entry/csp.js';

const log = debug('sku:middleware:vite');

const require = createRequire(import.meta.url);

const renderEntry = require.resolve('../entries/vite-render.js');
const clientEntry = require.resolve('../entries/vite-client.js');

export const skuViteMiddlewarePlugin = (skuContext: SkuContext): Plugin => ({
  name: 'vite-plugin-sku-server-middleware',
  async configureServer(server) {
    if (metricsMeasurers.initialPageLoad.isInitialPageLoad) {
      metricsMeasurers.initialPageLoad.mark();
    }
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

    log('Configuring server middleware');
    server.middlewares.use(async (req, res, next) => {
      log('Handling request:', req.url);
      if (!req.url) {
        log('No url found for request. Skipping render.');
        next();
        return;
      }
      const host = req.headers.host;
      const hostname = host?.split(':')[0];

      if (!hostname) {
        throw new Error(
          'Internal error occurred. No hostname found when handling middleware. Host header required.',
        );
      }
      const site =
        skuContext.sites.find((skuSite) => skuSite.host === hostname) ||
        skuContext.sites[0];

      const matchingRoute = getMatchingRoute({
        hostname: host,
        path: req.url,
        routes: skuContext.routes,
        sites: skuContext.sites,
      });

      if (!matchingRoute) {
        log('No matching route found for request. Skipping render.');
        next();
        return;
      }

      log('Matching route found:', matchingRoute);

      const language =
        getLanguageFromRoute(req.url, matchingRoute, skuContext) || '';

      const { viteRender } = await server.ssrLoadModule(renderEntry);

      const renderedHtml = await (viteRender as ViteRenderFunction)({
        environment: 'development',
        language,
        route: getRouteWithLanguage(matchingRoute.route, language),
        routeName: matchingRoute.name || '',
        site: site?.name || '',
        clientEntry,
      });

      const transformedHtml = await server.transformIndexHtml(
        req.url || '/',
        renderedHtml,
      );

      if (skuContext.cspEnabled) {
        const cspHandler = createCSPHandler({
          extraHosts: [
            skuContext.paths.publicPath,
            ...skuContext.cspExtraScriptSrcHosts,
          ],
          isDevelopment: process.env.NODE_ENV === 'development',
        });

        const cspHtml = cspHandler.handleHtml(transformedHtml);
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(cspHtml);
        return;
      }

      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(transformedHtml);
    });
  },
});
