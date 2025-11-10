import WebpackDevServer, { type Configuration } from 'webpack-dev-server';
import webpack from 'webpack';
import exceptionFormatter from 'exception-formatter';
import type { RequestHandler } from 'express';

import { openBrowser } from '../../../openBrowser.js';
import getCertificate from '../../../utils/certificate.js';

import getStatsConfig from '../../../services/webpack/config/statsConfig.js';
import createHtmlRenderPlugin from '../../../services/webpack/config/plugins/createHtmlRenderPlugin.js';
import makeWebpackConfig from '../../../services/webpack/config/webpack.config.js';

import { getAppHosts } from '../../../context/hosts.js';
import allocatePort from '../../../utils/allocatePort.js';
import { getSiteForHost } from '../../../context/getSiteForHost.js';
import { getMatchingRoute } from '../../../utils/routeMatcher.js';
import {
  getLanguageFromRoute,
  getRouteWithLanguage,
} from '../../../utils/language-utils.js';
import type { StatsChoices } from '../../options/stats.option.js';
import type { SkuContext } from '../../../context/createSkuContext.js';
import { serverUrls } from '@sku-lib/utils';

const localhost = '0.0.0.0';

const hot = process.env.SKU_HOT !== 'false';

export const webpackStartHandler = async ({
  stats: statsOption,
  environment,
  skuContext,
}: {
  stats: StatsChoices;
  environment: string;
  skuContext: SkuContext;
}) => {
  process.env.NODE_ENV = 'development';
  const { port, initialPath, paths, routes, httpsDevServer, sites, hosts } =
    skuContext;

  const availablePort = await allocatePort({
    port: port.client,
    host: localhost,
    strictPort: port.strictPort,
  });

  const htmlRenderPlugin = createHtmlRenderPlugin({
    skuContext,
    isStartScript: true,
  });

  const [clientWebpackConfig, renderWebpackConfig] = makeWebpackConfig({
    isDevServer: true,
    htmlRenderPlugin,
    metrics: true,
    hot,
    isStartScript: true,
    stats: statsOption,
    skuContext,
  });

  const clientCompiler = webpack(clientWebpackConfig);
  const renderCompiler = webpack(renderWebpackConfig);

  renderCompiler.watch({}, (err, stats) => {
    if (err) {
      console.error(err);
    }

    console.log(
      stats?.toString(
        getStatsConfig({
          stats: statsOption,
          isStartScript: true,
        }),
      ),
    );
  });

  const appHosts = getAppHosts(skuContext);

  let devServerMiddleware = null;
  if (paths.devServerMiddleware) {
    devServerMiddleware = (await import(paths.devServerMiddleware)).default;
  }

  const devServerConfig: Configuration = {
    devMiddleware: {
      publicPath: '/',
    },
    port: availablePort,
    host: localhost,
    allowedHosts: appHosts,
    hot,
    static: [
      {
        directory: paths.public,
        serveIndex: false,
      },
    ],
    client: {
      overlay: false,
    },
    setupExitSignals: true,
    setupMiddlewares: (middlewares, { app }) => {
      if (devServerMiddleware && typeof devServerMiddleware === 'function') {
        devServerMiddleware(app);
      }

      middlewares.push(((req, res, next) => {
        const matchingSiteName =
          getSiteForHost(req.hostname, undefined, sites) || '';

        const matchingRoute = getMatchingRoute({
          routes,
          hostname: req.hostname,
          path: req.path,
          sites,
        });

        if (!matchingRoute) {
          return next();
        }

        let chosenLanguage = '';

        try {
          chosenLanguage =
            getLanguageFromRoute(req.path, matchingRoute, skuContext) || '';
        } catch (e: any) {
          return res.status(500).send(
            exceptionFormatter(e, {
              format: 'html',
              inlineStyle: true,
              basepath: 'webpack://static/./',
            }),
          );
        }

        htmlRenderPlugin
          .renderWhenReady({
            route: getRouteWithLanguage(matchingRoute.route, chosenLanguage),
            routeName: matchingRoute.name || '',
            site: matchingSiteName,
            language: chosenLanguage,
            environment,
          })
          .then((html) => res.send(html))
          .catch((renderError) => {
            res.status(500).send(
              exceptionFormatter(renderError, {
                format: 'html',
                inlineStyle: true,
                basepath: 'webpack://static/./',
              }),
            );
          });
      }) as RequestHandler);

      return middlewares;
    },
  };

  if (httpsDevServer) {
    const pems = await getCertificate('.ssl', hosts);
    devServerConfig.server = {
      type: 'https',
      options: {
        key: pems,
        cert: pems,
      },
    };
  }

  const devServer = new WebpackDevServer(devServerConfig, clientCompiler);

  devServer.startCallback((err) => {
    if (err) {
      console.log(err);
      return;
    }

    const urls = serverUrls({
      hosts: appHosts,
      port: availablePort,
      initialPath,
      https: httpsDevServer,
    });

    console.log('Starting development server...');
    if (skuContext.listUrls) {
      urls.printAll();
    } else {
      urls.print();
    }

    openBrowser(urls.first());
  });
};
