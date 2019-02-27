process.env.NODE_ENV = 'development';

const opn = require('opn');
const WebpackDevServer = require('webpack-dev-server');
const webpack = require('webpack');
const { blue, underline } = require('chalk');

const { checkHosts, getAppHosts } = require('../lib/hosts');
const siteServeMiddleware = require('../lib/siteServeMiddleware');
const allocatePort = require('../lib/allocatePort');
const { port, initialPath, paths } = require('../context');
const makeWebpackConfig = require('../config/webpack/webpack.config');

const localhost = '0.0.0.0';

(async () => {
  const availablePort = await allocatePort({
    port: port.client,
    host: localhost,
  });

  const webpackCompiler = webpack(
    makeWebpackConfig({
      port: availablePort,
    }),
  );

  await checkHosts();

  const appHosts = getAppHosts();

  const devServer = new WebpackDevServer(webpackCompiler, {
    contentBase: paths.public,
    overlay: true,
    stats: 'errors-only',
    allowedHosts: appHosts,
    after: (app, server) => {
      app.get(
        '*',
        siteServeMiddleware({
          fs: server.middleware.fileSystem,
        }),
      );
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

    if (process.env.OPEN_TAB !== 'false') {
      opn(url);
    }
  });
})();
