process.env.NODE_ENV = 'development';

const WebpackDevServer = require('webpack-dev-server');
const webpack = require('webpack');
const { blue, underline } = require('chalk');
const exceptionFormatter = require('exception-formatter');
const pathToRegex = require('path-to-regexp');

const { checkHosts, getAppHosts } = require('../lib/hosts');
const createRenderer = require('../lib/createRenderer');
const allocatePort = require('../lib/allocatePort');
const openBrowser = require('../lib/openBrowser');
const { port, initialPath, paths, routes } = require('../context');
const makeWebpackConfig = require('../config/webpack/webpack.config');

const localhost = '0.0.0.0';

let renderer;
let buildReady = false;
let webpackStats;
const renderCallbacks = [];

function flushQueuedRequests() {
  if (renderCallbacks.length > 0) {
    renderCallbacks.shift()();
    flushQueuedRequests();
  }
}

function renderWhenReady(cb) {
  if (buildReady) {
    cb();
  }

  renderCallbacks.push(cb);
}

(async () => {
  const availablePort = await allocatePort({
    port: port.client,
    host: localhost,
  });

  const [clientConfig, renderConfig] = makeWebpackConfig({
    port: availablePort,
    isDevServer: true,
  });

  const clientCompiler = webpack(clientConfig);
  const renderCompiler = webpack(renderConfig);

  await checkHosts();

  const appHosts = getAppHosts();

  const devServer = new WebpackDevServer(clientCompiler, {
    contentBase: paths.public,
    overlay: true,
    stats: 'errors-only',
    allowedHosts: appHosts,
    after: app => {
      app.get('*', (req, res, next) => {
        console.log('Received request', req.path);

        const matchingRoute = routes.find(({ route }) =>
          pathToRegex(route).exec(req.path),
        );

        if (!matchingRoute) {
          return next();
        }

        console.log(matchingRoute);

        renderWhenReady(() => {
          console.log('Renderer ready. Attempting', req.path);

          renderer({
            webpackStats,
            route: matchingRoute.route,
            site: 'au',
            environment: 'production',
          })
            .then(html => {
              console.log(res.headersSent);

              res.send(html);
            })
            .catch(err => {
              console.log(err, 'Errors n stuff');

              // res.status(500).send(exceptionFormatter(err, { format: 'html' }));
            });
        });
      });
    },
  });

  clientCompiler.hooks.afterEmit.tap('sku-start', compilation => {
    webpackStats = compilation.getStats().toJson({
      hash: true,
      publicPath: true,
      assets: true,
      chunks: false,
      modules: false,
      source: false,
      errorDetails: false,
      timings: false,
    });
  });

  renderCompiler.hooks.watchRun.tap('sku-start', () => {
    console.log('Render code startin up');
    buildReady = false;
  });

  renderCompiler.hooks.afterEmit.tap('sku-start', compilation => {
    const shouldCreateRenderer = Object.values(compilation.assets).filter(
      ({ emitted }) => emitted,
    );

    if (shouldCreateRenderer) {
      renderer = createRenderer({
        fileName: 'render.js',
        compilation,
      });
    }
    buildReady = true;
    console.log('Build complete. Flushing queue');

    flushQueuedRequests();
  });

  renderCompiler.watch({}, () => {});

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
