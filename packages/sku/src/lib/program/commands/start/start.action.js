import WebpackDevServer from 'webpack-dev-server';
import webpack from 'webpack';
import chalk from 'chalk';
import exceptionFormatter from 'exception-formatter';

import { checkHosts, getAppHosts } from '../../../hosts.js';
import allocatePort from '../../../allocatePort.js';
import openBrowser from '../../../openBrowser/index.js';
import getSiteForHost from '../../../getSiteForHost.js';
import { resolveEnvironment } from '../../../resolveEnvironment.js';
import routeMatcher from '../../../routeMatcher.js';
import {
  port,
  initialPath,
  paths,
  routes,
  sites,
  httpsDevServer,
  useDevServerMiddleware,
} from '../../../../context/index.js';
import getStatsConfig from '../../../../config/webpack/statsConfig.js';
import createHtmlRenderPlugin from '../../../../config/webpack/plugins/createHtmlRenderPlugin.js';
import makeWebpackConfig from '../../../../config/webpack/webpack.config.js';
import getCertificate from '../../../certificate.js';
import {
  getLanguageFromRoute,
  getRouteWithLanguage,
} from '../../../language-utils.js';

import { watchVocabCompile } from '../../../runVocab.js';
import {
  configureProject,
  validatePeerDeps,
} from '../../../utils/configure.js';

const localhost = '0.0.0.0';

process.env.NODE_ENV = 'development';

const hot = process.env.SKU_HOT !== 'false';

export const startAction = async ({
  stats: statsOption,
  environment: environmentOption,
}) => {
  await configureProject();
  validatePeerDeps();
  console.log(chalk.blue(`sku start`));

  await watchVocabCompile();

  const environment = resolveEnvironment({ environment: environmentOption });

  console.log();

  const availablePort = await allocatePort({
    port: port.client,
    host: localhost,
  });

  const htmlRenderPlugin = createHtmlRenderPlugin();

  const [clientWebpackConfig, renderWebpackConfig] = makeWebpackConfig({
    isDevServer: true,
    htmlRenderPlugin,
    metrics: true,
    hot,
    isStartScript: true,
    stats: statsOption,
  });

  const clientCompiler = webpack(clientWebpackConfig);
  const renderCompiler = webpack(renderWebpackConfig);

  await checkHosts();

  renderCompiler.watch({}, (err, stats) => {
    if (err) {
      console.error(err);
    }

    console.log(
      stats.toString(
        getStatsConfig({
          stats: statsOption,
          isStartScript: true,
        }),
      ),
    );
  });

  const appHosts = getAppHosts();

  let devServerMiddleware = null;
  if (useDevServerMiddleware) {
    devServerMiddleware = (await import(paths.devServerMiddleware)).default;
  }

  /**
   * @type import('webpack-dev-server').Configuration
   */
  const devServerConfig = {
    devMiddleware: {
      publicPath: paths.publicPath,
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

      middlewares.push(
        /** @type {import("express").RequestHandler} */
        (req, res, next) => {
          const matchingSiteName = getSiteForHost(req.hostname);

          const matchingRoute = routes.find(({ route, siteIndex }) => {
            if (
              typeof siteIndex === 'number' &&
              matchingSiteName !== sites[siteIndex].name
            ) {
              return false;
            }

            return routeMatcher(route)(req.path);
          });

          if (!matchingRoute) {
            return next();
          }

          let chosenLanguage;

          try {
            chosenLanguage = getLanguageFromRoute(req, matchingRoute);
          } catch (e) {
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
        },
      );

      return middlewares;
    },
  };

  if (httpsDevServer) {
    const pems = await getCertificate();
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
      appHosts[0]
    }:${availablePort}${initialPath}`;

    console.log();
    console.log(
      chalk.blue(`Starting the development server on ${chalk.underline(url)}`),
    );
    console.log();

    openBrowser(url);
  });
};
