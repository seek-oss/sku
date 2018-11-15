process.env.NODE_ENV = 'development';

const WebpackDevServer = require('webpack-dev-server');
const webpack = require('webpack');
const opn = require('opn');
const fs = require('fs-extra');
const { promisify } = require('util');
const webpackPromise = promisify(require('webpack'));

const { hosts, port, initialPath, paths } = require('../context');
const [
  clientWebpackConfig,
  serverWebpackConfig
] = require('../config/webpack/webpack.config.ssr');

const compiler = webpack(clientWebpackConfig);
const devServer = new WebpackDevServer(compiler, {
  contentBase: paths.public,
  historyApiFallback: true,
  overlay: true,
  stats: 'errors-only',
  allowedHosts: hosts,
  hot: true,
  headers: { 'Access-Control-Allow-Origin': '*' }
});

devServer.listen(port.client, '127.0.0.1', err => {
  if (err) {
    console.log(err);
    return;
  }

  const url = `http://${hosts[0]}:${port.client}`;

  console.log();
  console.log(`Starting the development server on ${url}...`);
  console.log();
});

const runWebpack = config => {
  return webpackPromise(config).then(stats => {
    console.log(
      stats.toString({
        chunks: false, // Makes the build much quieter
        children: false,
        colors: true
      })
    );

    if (stats.hasErrors()) {
      throw new Error();
    }
  });
};

const copyPublicFiles = () => {
  if (fs.existsSync(paths.public)) {
    fs.copySync(paths.public, paths.target, {
      dereference: true
    });
    console.log(`Copying ${paths.public} to ${paths.target}`);
  }
};

runWebpack(serverWebpackConfig)
  .then(copyPublicFiles)
  .then(() => {
    const url = `http://${hosts[0]}:${port.server}${initialPath}`;
    console.log(`Starting the back-end development server on ${url}...`);
    if (process.env.OPEN_TAB !== 'false') {
      opn(url);
    }
  })
  .catch(() => process.exit(1));
