process.env.NODE_ENV = 'development';

const WebpackDevServer = require('webpack-dev-server');
const webpack = require('webpack');
const { blue, underline } = require('chalk');
const exceptionFormatter = require('exception-formatter');

const { checkHosts, getAppHosts } = require('../../../hosts');
const allocatePort = require('../../../allocatePort');
const openBrowser = require('../../../openBrowser');
const getSiteForHost = require('../../../getSiteForHost');
const resolveEnvironment = require('../../../resolveEnvironment');
const routeMatcher = require('../../../routeMatcher');
const {
  port,
  initialPath,
  paths,
  routes,
  sites,
  httpsDevServer,
  useDevServerMiddleware,
} = require('../../../../context');
const getStatsConfig = require('../../../../config/webpack/statsConfig');
const createHtmlRenderPlugin = require('../../../../config/webpack/plugins/createHtmlRenderPlugin');
const makeWebpackConfig = require('../../../../config/webpack/webpack.config');
const getCertificate = require('../../../certificate');
const {
  getLanguageFromRoute,
  getRouteWithLanguage,
} = require('../../../language-utils');

const { watchVocabCompile } = require('../../../runVocab');
const {
  configureProject,
  validatePeerDeps,
} = require('../../../utils/config-validators');

const localhost = '0.0.0.0';

const hot = process.env.SKU_HOT !== 'false';

const startAction = async ({ stats: statsOption }) => {
  await configureProject();
  validatePeerDeps();
  console.log(blue(`sku start`));

  await watchVocabCompile();

  const environment = resolveEnvironment();

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
          stats: '',
          isStartScript: true,
        }),
      ),
    );
  });

  const appHosts = getAppHosts();

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
      if (useDevServerMiddleware) {
        const devServerMiddleware = require(paths.devServerMiddleware);
        if (devServerMiddleware && typeof devServerMiddleware === 'function') {
          devServerMiddleware(app);
        }
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
    console.log(blue(`Starting the development server on ${underline(url)}`));
    console.log();

    openBrowser(url);
  });
};

module.exports = startAction;
