process.env.NODE_ENV = 'development';

const WebpackDevServer = require('webpack-dev-server');
const webpack = require('webpack');
const { blue, underline } = require('chalk');
const exceptionFormatter = require('exception-formatter');
const { pathToRegexp } = require('path-to-regexp');

const { watch } = require('../lib/runWebpack');
const { checkHosts, getAppHosts } = require('../lib/hosts');
const allocatePort = require('../lib/allocatePort');
const openBrowser = require('../lib/openBrowser');
const getSiteForHost = require('../lib/getSiteForHost');
const resolveEnvironment = require('../lib/resolveEnvironment');
const {
  port,
  initialPath,
  paths,
  routes,
  isLibrary,
  httpsDevServer,
  useDevServerMiddleware,
} = require('../context');
const createHtmlRenderPlugin = require('../config/webpack/plugins/createHtmlRenderPlugin');
const makeWebpackConfig = require('../config/webpack/webpack.config');
const getCertificate = require('../lib/certificate');

const localhost = '0.0.0.0';

const hot = process.env.SKU_HOT !== 'false';

(async () => {
  console.log(blue(`sku start`));

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

  watch(renderCompiler);

  const appHosts = getAppHosts();

  const devServerConfig = {
    contentBase: paths.public,
    publicPath: paths.publicPath,
    host: appHosts[0],
    overlay: true,
    stats: 'errors-only',
    allowedHosts: appHosts,
    serveIndex: false,
    hot,
    clientLogLevel: 'warn',
  };

  if (httpsDevServer) {
    const pems = await getCertificate();
    devServerConfig.https = true;
    devServerConfig.key = pems;
    devServerConfig.cert = pems;
  }

  const devServer = new WebpackDevServer(clientCompiler, {
    ...devServerConfig,
    after: (app) => {
      if (useDevServerMiddleware) {
        const devServerMiddleware = require(paths.devServerMiddleware);
        if (devServerMiddleware && typeof devServerMiddleware === 'function') {
          devServerMiddleware(app);
        }
      }
      app.get('*', (req, res, next) => {
        const matchingRoute = routes.find(({ route }) => {
          const normalisedRoute = route
            .split('/')
            .map((part) => {
              if (part.startsWith('$')) {
                // Path is dynamic, map to ':id' style syntax supported by pathToRegexp
                return `:${part.slice(1)}`;
              }

              return part;
            })
            .join('/');

          return pathToRegexp(normalisedRoute).exec(req.path);
        });

        if (!matchingRoute) {
          return next();
        }

        htmlRenderPlugin
          .renderWhenReady({
            route: matchingRoute.route,
            routeName: matchingRoute.name,
            site: getSiteForHost(req.hostname),
            environment,
          })
          .then((html) => res.send(html))
          .catch((renderError) => {
            let devServerScripts = [];

            if (renderError.webpackStats && !isLibrary) {
              const webpackStats = renderError.webpackStats.toJson();

              devServerScripts = webpackStats.entrypoints.devServerOnly.assets.map(
                (asset) => `<script src="/${asset}"></script>`,
              );
            }

            res.status(500).send(
              exceptionFormatter(renderError, {
                format: 'html',
                inlineStyle: true,
                basepath: 'webpack://static/./',
              }).concat(...devServerScripts),
            );
          });
      });
    },
  });

  devServer.listen(availablePort, localhost, (err) => {
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
})();
