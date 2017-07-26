const WebpackDevServer = require('webpack-dev-server');
const webpack = require('webpack');
const webpackConfig = require('../config/webpack/webpack.config');
const builds = require('../config/builds');
const opn = require('opn');

const { hosts, port } = builds[0];

const compiler = webpack(webpackConfig);
const devServer = new WebpackDevServer(compiler, {
  contentBase: builds.map(({ paths }) => paths.public),
  historyApiFallback: true,
  overlay: true,
  stats: 'errors-only',
  allowedHosts: hosts
});

devServer.listen(port, (err, result) => {
  if (err) {
    return console.log(err);
  }

  const url = `http://${hosts[0]}:${port}`;

  console.log(`Starting the development server on ${url}...`);
  console.log();

  if (process.env.OPEN_TAB !== 'false') {
    opn(url);
  }
});
