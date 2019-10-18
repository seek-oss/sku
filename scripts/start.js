process.env.NODE_ENV = 'development';

const WebpackDevServer = require('webpack-dev-server');
const webpack = require('webpack');
const { blue, underline } = require('chalk');
const exceptionFormatter = require('exception-formatter');
const pathToRegex = require('path-to-regexp');

const { checkHosts, getAppHosts } = require('../lib/hosts');
const createRenderProvider = require('../lib/staticRenderer');
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
const makeWebpackConfig = require('../config/webpack/webpack.config');

const localhost = '0.0.0.0';

(async () => {
  const availablePort = await allocatePort({
    port: port.client,
    host: localhost,
  });

  const config = makeWebpackConfig({
    port: availablePort,
    isDevServer: true,
  });

  const parentCompiler = webpack(config);

  const clientCompiler = parentCompiler.compilers.find(
    c => c.name === 'client',
  );
  const renderCompiler = parentCompiler.compilers.find(
    c => c.name === 'render',
  );

  await checkHosts();

  const appHosts = getAppHosts();

  const { renderWhenReady } = createRenderProvider({
    clientCompiler,
    renderCompiler,
  });

  const getSiteForHost = hostname => {
    if (sites.length === 0) {
      return undefined;
    }

    const matchingSite = sites.find(site => site.host === hostname);

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
    after: app => {
      // eslint-disable-next-line consistent-return
      app.get('*', (req, res, next) => {
        const matchingRoute = routes.find(({ route }) =>
          pathToRegex(route).exec(req.path),
        );

        if (!matchingRoute) {
          return next();
        }

        renderWhenReady(async ({ renderer, webpackStats }) => {
          try {
            const html = await renderer({
              webpackStats,
              route: matchingRoute.route,
              routeName: matchingRoute.name,
              site: getSiteForHost(req.hostname),
              environment:
                environments.length > 0 ? environments[0] : undefined,
            });

            res.send(html);
          } catch (err) {
            // Library mode does not have "devServerOnly" entry as it is a UMD
            const devServerAssets = !isLibrary
              ? webpackStats.entrypoints.devServerOnly.assets
              : [];

            const devServerScripts = devServerAssets.map(
              asset => `<script src="/${asset}"></script>`,
            );

            res.status(500).send(
              exceptionFormatter(err, {
                format: 'html',
                inlineStyle: true,
                basepath: 'webpack://static/./',
              }).concat(...devServerScripts),
            );
          }
        });
      });
    },
  });

  devServer.listen(availablePort, localhost, err => {
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
