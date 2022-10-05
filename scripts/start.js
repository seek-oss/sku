process.env.NODE_ENV = 'development';

const WebpackDevServer = require('webpack-dev-server');
const webpack = require('webpack');
const { blue, underline } = require('chalk');
const exceptionFormatter = require('exception-formatter');
const onDeath = require('death');
const debug = require('debug')('sku:start');

const { checkHosts, getAppHosts } = require('../lib/hosts');
const allocatePort = require('../lib/allocatePort');
const openBrowser = require('../lib/openBrowser');
const getSiteForHost = require('../lib/getSiteForHost');
const resolveEnvironment = require('../lib/resolveEnvironment');
const routeMatcher = require('../lib/routeMatcher');
const {
  port,
  initialPath,
  paths,
  routes,
  sites,
  httpsDevServer,
  useDevServerMiddleware,
} = require('../context');
const statsConfig = require('../config/webpack/statsConfig');
const createHtmlRenderPlugin = require('../config/webpack/plugins/createHtmlRenderPlugin');
const makeWebpackConfig = require('../config/webpack/webpack.config');
const getCertificate = require('../lib/certificate');
const {
  getLanguageFromRoute,
  getRouteWithLanguage,
} = require('../lib/language-utils');

const { watchVocabCompile } = require('../lib/runVocab');

const localhost = '0.0.0.0';

const hot = process.env.SKU_HOT !== 'false';

(async () => {
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
    port: availablePort,
    isDevServer: true,
    htmlRenderPlugin,
    metrics: true,
    hot,
  });

  const clientCompiler = webpack(clientWebpackConfig);
  const renderCompiler = webpack(renderWebpackConfig);

  await checkHosts();

  renderCompiler.watch({}, (err, stats) => {
    if (err) {
      console.error(err);
    }

    console.log(stats.toString(statsConfig));
  });

  const appHosts = getAppHosts();

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

  const devServer = new WebpackDevServer(
    {
      ...devServerConfig,
      setupMiddlewares: (middlewares, { app }) => {
        if (useDevServerMiddleware) {
          const devServerMiddleware = require(paths.devServerMiddleware);
          if (
            devServerMiddleware &&
            typeof devServerMiddleware === 'function'
          ) {
            devServerMiddleware(app);
          }
        }

        middlewares.push((req, res, next) => {
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
        });

        return middlewares;
      },
    },
    clientCompiler,
  );

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

  onDeath(() => {
    devServer.stopCallback(() => {
      debug('Webpack dev server closed');
    });
  });
})();
