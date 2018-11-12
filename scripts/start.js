process.env.NODE_ENV = 'development';

const opn = require('opn');
const WebpackDevServer = require('webpack-dev-server');
const webpack = require('webpack');

const { hosts, port, initialPath, paths } = require('../context');
const webpackConfig = require('../config/webpack/webpack.config');

const compiler = webpack(webpackConfig);
const devServer = new WebpackDevServer(compiler, {
  contentBase: paths.public,
  historyApiFallback: true,
  overlay: true,
  stats: 'errors-only',
  allowedHosts: hosts
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
