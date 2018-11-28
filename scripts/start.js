process.env.NODE_ENV = 'development';

const opn = require('opn');
const WebpackDevServer = require('webpack-dev-server');

const dynamicRouteMiddlware = require('../lib/dynamicRouteMiddleware');
const { hosts, port, initialPath, paths, routes } = require('../context');
const webpackCompiler = require('../config/webpack/webpack.compiler');

const dynamicRoutes = routes
  .filter(({ route }) => /\:/.test(route))
  .map(({ route }) => route);

const devServer = new WebpackDevServer(webpackCompiler, {
  contentBase: paths.public,
  overlay: true,
  stats: 'errors-only',
  allowedHosts: hosts,
  after: (app, server) => {
    app.get(
      '*',
      dynamicRouteMiddlware({
        dynamicRoutes,
        fs: server.middleware.fileSystem,
        rootDirectory: paths.target
      })
    );
  }
});

devServer.listen(port.client, '0.0.0.0', err => {
  if (err) {
    console.log(err);
    return;
  }

  const url = `http://${hosts[0]}:${port.client}${initialPath}`;

  console.log();
  console.log(`Starting the development server on ${url}...`);
  console.log();

  if (process.env.OPEN_TAB !== 'false') {
    opn(url);
  }
});
