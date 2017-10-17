const WebpackDevServer = require('webpack-dev-server');
const webpack = require('webpack');
const webpackConfig = require('../config/webpack/webpack.config');
const builds = require('../config/builds');
const opn = require('opn');
const Promise = require('bluebird');
const webpackPromise = Promise.promisify(require('webpack'));
const fs = require('fs-extra');
const { hosts, port } = builds[0];
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

devServer.listen(port[0], '127.0.0.1', (err, result) => {
  if (err) {
    return console.log(err);
  }

  const url = `http://${hosts[0]}:${port[0]}`;

  console.log();
  console.log(`Starting the development server on ${url}...`);
  console.log();

  if (process.env.OPEN_TAB !== 'false' && !serverEntry) {
    opn(url);
  }
});

if (serverEntry) {
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
      const url = `http://${hosts[0]}:${port[1]}`;
      console.log(`Starting the back-end development server on ${url}...`);
      if (process.env.OPEN_TAB !== 'false') {
        opn(url);
      }
    })
    .catch(() => process.exit(1));
}
