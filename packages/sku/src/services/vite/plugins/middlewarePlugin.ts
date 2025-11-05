import type { SkuContext } from '../../../context/createSkuContext.js';
import type { Plugin } from 'vite';
import { createRequire } from 'node:module';
import type { ViteRenderFunction } from '../../../types/types.js';
import { getMatchingRoute } from '../../../utils/routeMatcher.js';
import debug from 'debug';
import {
  getLanguageFromRoute,
  getRouteWithLanguage,
} from '../../../utils/language-utils.js';
import { metricsMeasurers } from '../../telemetry/metricsMeasurers.js';
import createCSPHandler from '../../webpack/entry/csp.js';

const log = debug('sku:middleware:vite');

const require = createRequire(import.meta.url);

const renderEntry = require.resolve('../entries/vite-render.js');
const clientEntry = require.resolve('../entries/vite-client.js');

export const middlewarePlugin = ({
  skuContext,
  environment,
}: {
  skuContext: SkuContext;
  environment: string;
}): Plugin => ({
  name: 'vite-plugin-sku-server-middleware',
  async configureServer(server) {
    if (
      metricsMeasurers.initialPageLoad.isInitialPageLoad &&
      metricsMeasurers.initialPageLoad.openTab
    ) {
      metricsMeasurers.initialPageLoad.mark();
    }
    // We need to start loading the devMiddleware before Vite's middleware runs.
    // Trying to lazy load it after Vite's middleware causes the Vite 404 middleware to take over the requests because this hook is run async.
    if (skuContext.paths.devServerMiddleware) {
      log(
        'Using dev server middleware at %s',
        skuContext.paths.devServerMiddleware,
      );
      const devServerMiddleware = (
        await import(skuContext.paths.devServerMiddleware)
      ).default;
      if (devServerMiddleware && typeof devServerMiddleware === 'function') {
        devServerMiddleware(server.middlewares);
        log('Dev server middleware loaded');
      }
    }

    // Code returned from here will run *after* Vite's middleware. Lazy loading middleware should happen outside (before) this return.
    return async () => {
      log('Configuring server middleware');

      server.middlewares.use('/', async (req, res, next) => {
        log('Handling request:', req.url);

        // Check that the request is for the index.html file (i.e., a valid route in our app)
        // If we don't check for index.html, the middleware will run for every request, including static assets.
        if (!req.originalUrl || req.url !== '/index.html') {
          log('No url found for request. Skipping render.');
          next();
          return;
        }

        // `host` header is available in vite http requests. `:authority` pseudo-header is available in vite https requests. `:authority` is used in HTTP/2.
        // @see https://stackoverflow.com/questions/70502726/what-is-the-purpose-of-http2-pseudo-headers-authority-method
        const host = req.headers.host ?? (req.headers[':authority'] as string);
        const hostname = host?.split(':')[0];

        if (!hostname) {
          throw new Error(
            'Internal error occurred. No hostname found when handling middleware. Host header required.',
          );
        }

        const site =
          skuContext.sites.find((skuSite) => skuSite.host === hostname) ||
          skuContext.sites[0];

        // Reconstruct the URL to get the pathname since it's not available in the request object
        // `req.originalUrl` is the full URL path, including query parameters.
        const url = new URL(req.originalUrl, `http://${host}`);
        const { pathname: path } = url;

        const matchingRoute = getMatchingRoute({
          hostname: host,
          path,
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
          getLanguageFromRoute(path, matchingRoute, skuContext) ?? '';

        try {
          const { viteRender } = await server.ssrLoadModule(renderEntry);

          let html = await (viteRender as ViteRenderFunction)({
            environment,
            language,
            route: getRouteWithLanguage(matchingRoute.route, language),
            routeName: matchingRoute.name || '',
            site: site?.name || '',
            clientEntry,
          });

          html = await server.transformIndexHtml(req.url || '/', html);

          if (skuContext.cspEnabled) {
            const cspHandler = createCSPHandler({
              extraHosts: [
                skuContext.paths.publicPath,
                ...skuContext.cspExtraScriptSrcHosts,
              ],
              isDevelopment: process.env.NODE_ENV === 'development',
            });

            html = cspHandler.handleHtml(html);
          }

          res.writeHead(200, { 'Content-Type': 'text/html' });
          res.end(html);
        } catch (e) {
          // If an error is caught, let vite fix the stracktrace so it maps back to
          // your actual source code.
          res.writeHead(500);
          log(e);

          if (e instanceof Error) {
            server.ssrFixStacktrace(e);
            res.end(e.stack);
          } else {
            res.end(JSON.stringify(e));
          }
        }
      });
    };
  },
});
