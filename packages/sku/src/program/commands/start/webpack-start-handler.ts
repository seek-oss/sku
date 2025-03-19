import WebpackDevServer, { type Configuration } from 'webpack-dev-server';
import webpack from 'webpack';
import chalk from 'chalk';
import exceptionFormatter from 'exception-formatter';
import type { RequestHandler } from 'express';

import openBrowser from '@/openBrowser/index.js';
import getCertificate from '@/utils/certificate.js';

import getStatsConfig from '@/services/webpack/config/statsConfig.js';
import createHtmlRenderPlugin from '@/services/webpack/config/plugins/createHtmlRenderPlugin.js';
import makeWebpackConfig from '@/services/webpack/config/webpack.config.js';
import { watchVocabCompile } from '@/services/vocab/runVocab.js';

import { checkHosts, getAppHosts } from '@/utils/contextUtils/hosts.js';
import allocatePort from '@/utils/allocatePort.js';
import getSiteForHost from '@/utils/contextUtils/getSiteForHost.js';
import { resolveEnvironment } from '@/utils/contextUtils/resolveEnvironment.js';
import { getMatchingRoute } from '@/utils/routeMatcher.js';
import { configureProject, validatePeerDeps } from '@/utils/configure.js';
import {
  getLanguageFromRoute,
  getRouteWithLanguage,
} from '@/utils/language-utils.js';
import type { StatsChoices } from '@/program/options/stats/stats.option.js';
import type { SkuContext } from '@/context/createSkuContext.js';

const localhost = '0.0.0.0';

const hot = process.env.SKU_HOT !== 'false';

export const webpackStartHandler = async ({
  stats: statsOption,
  environment: environmentOption,
  skuContext,
}: {
  stats: StatsChoices;
  environment: string;
  skuContext: SkuContext;
}) => {
  process.env.NODE_ENV = 'development';
  const {
    port,
    initialPath,
    paths,
    routes,
    httpsDevServer,
    useDevServerMiddleware,
    sites,
    hosts,
  } = skuContext;
  await configureProject(skuContext);
  validatePeerDeps(skuContext);
  console.log(chalk.blue(`sku start`));

  await watchVocabCompile(skuContext);

  const environment = resolveEnvironment({
    environment: environmentOption,
    skuContext,
  });

  console.log();

  const availablePort = await allocatePort({
    port: port.client,
    host: localhost,
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

  await checkHosts(skuContext);

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

  const appHosts = getAppHosts(skuContext) as string | string[] | undefined;

  let devServerMiddleware = null;
  if (useDevServerMiddleware) {
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
        const matchingSiteName = getSiteForHost(req.hostname, undefined, sites);

        const matchingRoute = getMatchingRoute({
          routes,
          hostname: req.hostname,
          path: req.path,
          sites,
        });

        if (!matchingRoute) {
          return next();
        }

        let chosenLanguage;

        try {
          chosenLanguage = getLanguageFromRoute(
            req.path,
            matchingRoute,
            skuContext,
          );
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
            routeName: matchingRoute.name,
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

    const url = `${httpsDevServer ? 'https' : 'http'}://${
      appHosts?.[0]
    }:${availablePort}${initialPath}`;

    console.log();
    console.log(
      chalk.blue(`Starting the development server on ${chalk.underline(url)}`),
    );
    console.log();

    openBrowser(url);
  });
};
