process.env.NODE_ENV = 'development';

const WebpackDevServer = require('webpack-dev-server');
const webpack = require('webpack');
const { blue, underline } = require('chalk');
const exceptionFormatter = require('exception-formatter');
const { pathToRegexp } = require('path-to-regexp');

const { checkHosts, getAppHosts } = require('../lib/hosts');
const allocatePort = require('../lib/allocatePort');
const openBrowser = require('../lib/openBrowser');
const {
  port,
  initialPath,
  paths,
  routes,
  sites,
  environments,
  isLibrary,
} = require('../context');
const createHtmlRenderPlugin = require('../config/webpack/plugins/createHtmlRenderPlugin');
const makeWebpackConfig = require('../config/webpack/webpack.config');

const localhost = '0.0.0.0';

(async () => {
  const availablePort = await allocatePort({
    port: port.client,
    host: localhost,
  });

  const htmlRenderPlugin = createHtmlRenderPlugin();

  const config = makeWebpackConfig({
    port: availablePort,
    isDevServer: true,
    htmlRenderPlugin,
  });

  const parentCompiler = webpack(config);

  await checkHosts();

  const appHosts = getAppHosts();

  const getSiteForHost = (hostname) => {
    if (sites.length === 0) {
      return undefined;
    }

    const matchingSite = sites.find((site) => site.host === hostname);

    return matchingSite ? matchingSite.name : sites[0].name;
  };

  const devServer = new WebpackDevServer(parentCompiler, {
    contentBase: paths.public,
    publicPath: paths.publicPath,
    host: appHosts[0],
    overlay: true,
    stats: 'errors-only',
    allowedHosts: appHosts,
    serveIndex: false,
    after: (app) => {
      app.get('*', (req, res, next) => {
        const matchingRoute = routes.find(({ route }) =>
          pathToRegexp(route).exec(req.path),
        );

        if (!matchingRoute) {
          return next();
        }

        htmlRenderPlugin
          .renderWhenReady({
            route: matchingRoute.route,
            routeName: matchingRoute.name,
            site: getSiteForHost(req.hostname),
            environment: environments.length > 0 ? environments[0] : undefined,
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

    const url = `http://${appHosts[0]}:${availablePort}${initialPath}`;

    console.log();
    console.log(blue(`Starting the development server on ${underline(url)}`));
    console.log();

    openBrowser(url);
  });
})();
