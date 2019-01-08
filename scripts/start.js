process.env.NODE_ENV = 'development';

const opn = require('opn');
const WebpackDevServer = require('webpack-dev-server');
const getPort = require('get-port');
const { yellow, blue, underline, bold } = require('chalk');

const dynamicRouteMiddleware = require('../lib/dynamicRouteMiddleware');
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
      dynamicRouteMiddleware({
        dynamicRoutes,
        fs: server.middleware.fileSystem,
        rootDirectory: paths.target
      })
    );
  }
});

(async () => {
  const localhost = '0.0.0.0';
  const availablePort = await getPort({ port: port.client, host: localhost });

  if (availablePort !== port.client) {
    console.log(
      yellow(
        `Warning: Requested port ${bold(
          port.client
        )} is unavailable. Falling back to ${bold(availablePort)}.`
      )
    );
  }

  devServer.listen(availablePort, localhost, err => {
    if (err) {
      console.log(err);
      return;
    }

    const url = `http://${hosts[0]}:${availablePort}${initialPath}`;

    console.log();
    console.log(blue(`Starting the development server on ${underline(url)}`));
    console.log();

    if (process.env.OPEN_TAB !== 'false') {
      opn(url);
    }
  });
})();
