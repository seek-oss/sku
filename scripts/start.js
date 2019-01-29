process.env.NODE_ENV = 'development';

const opn = require('opn');
const WebpackDevServer = require('webpack-dev-server');
const webpack = require('webpack');
const bodyParser = require('body-parser');
const { blue, underline } = require('chalk');

const { writeStartConfig } = require('../lib/startConfig');
const dynamicRouteMiddleware = require('../lib/dynamicRouteMiddleware');
const allocatePort = require('../lib/allocatePort');
const { hosts, port, initialPath, paths, routes } = require('../context');
const makeWebpackConfig = require('../config/webpack/webpack.config');

const jsonParser = bodyParser.json();

const localhost = '0.0.0.0';

(async () => {
  const availablePort = await allocatePort({
    port: port.client,
    host: localhost
  });

  const dynamicRoutes = routes
    .filter(({ route }) => /\:/.test(route))
    .map(({ route }) => route);

  const webpackCompiler = webpack(
    makeWebpackConfig({
      port: availablePort
    })
  );

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

      app.post('/sku/app-config', jsonParser, (req, res) => {
        writeStartConfig(req.body);

        res.sendStatus(200);
      });
    }
  });

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
