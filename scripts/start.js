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

  const devServer = new WebpackDevServer(parentCompiler, {
    contentBase: paths.public,
    overlay: true,
    stats: 'errors-only',
    allowedHosts: appHosts,
    after: app => {
      app.get('*', (req, res, next) => {
        console.log('Received request', { path: req.path, query: req.query });
        const start = Date.now();

        const matchingRoute = routes.find(({ route }) =>
          pathToRegex(route).exec(req.path),
        );

        if (!matchingRoute) {
          return next();
        }

        renderWhenReady(({ renderer, webpackStats }) => {
          console.log('Renderer ready. Attempting', req.path);

          const matchingSite = sites.find(site => site.host === req.hostname);

          renderer({
            webpackStats,
            route: matchingRoute.route,
            site: matchingSite ? matchingSite.name : sites[0].name,
            environment: environments.length > 0 ? environments[0] : undefined,
          })
            .then(html => {
              console.log('Request sent after', Date.now() - start);

              res.send(html);
            })
            .catch(err => {
              // res.status(500).send(exceptionFormatter(err, { format: 'html' }));
              console.log(err);

              next();
            });
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
