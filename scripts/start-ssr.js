process.env.NODE_ENV = 'development';

const WebpackDevServer = require('webpack-dev-server');
const webpack = require('webpack');
const webpackConfig = require('../config/webpack/webpack.config.ssr');
const builds = require('../config/builds');
const opn = require('opn');
const Promise = require('bluebird');
const webpackPromise = Promise.promisify(require('webpack'));
const fs = require('fs-extra');
const { hosts, port, initialPath } = builds[0];
const serverEntry = builds[0].paths.serverEntry;

const compiler = webpack(serverEntry ? webpackConfig[0] : webpackConfig);
const devServer = new WebpackDevServer(compiler, {
  contentBase: builds.map(({ paths }) => paths.public),
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
  builds.forEach(({ paths }) => {
    if (fs.existsSync(paths.public)) {
      fs.copySync(paths.public, paths.dist, {
        dereference: true
      });
      console.log(`Copying ${paths.public} to ${paths.dist}`);
    }
  });
};

runWebpack(webpackConfig[1])
  .then(copyPublicFiles)
  .then(() => {
    const url = `http://${hosts[0]}:${port.backend}${initialPath}`;
    console.log(`Starting the back-end development server on ${url}...`);
    if (process.env.OPEN_TAB !== 'false') {
      opn(url);
    }
  })
  .catch(() => process.exit(1));
