process.env.NODE_ENV = 'development';

const WebpackDevServer = require('webpack-dev-server');
const webpack = require('webpack');
const opn = require('opn');
const { once } = require('lodash');

const { watch } = require('../lib/runWebpack');
const {
  copyPublicFiles,
  ensureTargetDirectory
} = require('../lib/buildFileUtils');
const { hosts, port, initialPath, paths } = require('../context');
const [
  clientWebpackConfig,
  serverWebpackConfig
] = require('../config/webpack/webpack.config.ssr');

// Make sure target directory exists before starting
ensureTargetDirectory();

const clientCompiler = webpack(clientWebpackConfig);
const serverCompiler = webpack(serverWebpackConfig);

// Starts the server webpack config running.
// We only want to do this once as it runs in watch mode
const startServerWatch = once(async () => {
  try {
    console.log('Start server compile');

    await copyPublicFiles();
    await watch(serverCompiler);

    const url = `http://${hosts[0]}:${port.server}${initialPath}`;
    console.log(`Starting the back-end development server on ${url}...`);
    if (process.env.OPEN_TAB !== 'false') {
      opn(url);
    }
  } catch (e) {
    console.log(e);

    process.exit(1);
  }
});

// Make sure the client webpack config is complete before
// starting the server build. The server relies on the client assets.
clientCompiler.hooks.afterEmit.tap('sku start-ssr', async () => {
  startServerWatch();
});

// Start webpack dev server using only the client config
const devServer = new WebpackDevServer(clientCompiler, {
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
