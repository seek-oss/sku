process.env.NODE_ENV = 'development';

const WebpackDevServer = require('webpack-dev-server');
const webpack = require('webpack');
const { once } = require('lodash');
const { blue, underline } = require('chalk');

const { watch } = require('../lib/runWebpack');
const getCertificate = require('../lib/certificate');
const {
  copyPublicFiles,
  ensureTargetDirectory,
} = require('../lib/buildFileUtils');
const { checkHosts, getAppHosts } = require('../lib/hosts');
const { port, initialPath, paths, httpsDevServer } = require('../context');
const makeWebpackConfig = require('../config/webpack/webpack.config.ssr');
const allocatePort = require('../lib/allocatePort');
const openBrowser = require('../lib/openBrowser');

const { getVocabConfig } = require('../config/vocab/vocab');
const { compile } = require('@vocab/core');

const hot = process.env.SKU_HOT !== 'false';

const localhost = '0.0.0.0';

(async () => {
  const vocabConfig = getVocabConfig();
  if (vocabConfig) {
    console.log('Starting Vocab compile in watch mode');
    await compile({ watch: true }, vocabConfig);
  }

  // Find available ports if requested ones aren't available
  const clientPort = await allocatePort({
    port: port.client,
    host: localhost,
  });
  const serverPort = await allocatePort({
    port: port.server,
    host: localhost,
  });

  const [clientWebpackConfig, serverWebpackConfig] = makeWebpackConfig({
    clientPort,
    serverPort,
    isDevServer: true,
    hot,
  });

  await checkHosts();

  const appHosts = getAppHosts();

  // Make sure target directory exists before starting
  ensureTargetDirectory();

  const clientCompiler = webpack(clientWebpackConfig);
  const serverCompiler = webpack(serverWebpackConfig);

  const proto = httpsDevServer ? 'https' : 'http';

  const serverUrl = `${proto}://${appHosts[0]}:${serverPort}${initialPath}`;
  const webpackDevServerUrl = `${proto}://${appHosts[0]}:${clientPort}`;

  console.log();
  console.log(
    blue(
      `Starting the webpack dev server on ${underline(webpackDevServerUrl)}`,
    ),
  );
  console.log(
    blue(`Starting the SSR development server on ${underline(serverUrl)}`),
  );
  console.log();

  // Starts the server webpack config running.
  // We only want to do this once as it runs in watch mode
  const startServerWatch = once(async () => {
    try {
      console.log('Start server compile');

      await copyPublicFiles();
      await watch(serverCompiler);

      openBrowser(serverUrl);
    } catch (e) {
      console.log(e);

      process.exit(1);
    }
  });

  // Make sure the client webpack config is complete before
  // starting the server build. The server relies on the client assets.
  clientCompiler.hooks.afterEmit.tap('sku start-ssr', () => {
    startServerWatch();
  });

  const devServerConfig = {
    contentBase: paths.public,
    publicPath: paths.publicPath,
    host: appHosts[0],
    historyApiFallback: true,
    overlay: true,
    stats: 'errors-only',
    allowedHosts: appHosts,
    hot,
    headers: { 'Access-Control-Allow-Origin': '*' },
    sockPort: clientPort,
    clientLogLevel: 'warn',
  };

  if (httpsDevServer) {
    const pems = await getCertificate();
    devServerConfig.https = true;
    devServerConfig.key = pems;
    devServerConfig.cert = pems;
  }

  // Start webpack dev server using only the client config
  const devServer = new WebpackDevServer(clientCompiler, devServerConfig);

  devServer.listen(clientPort, localhost, (err) => {
    if (err) {
      console.log(err);
      return;
    }
  });
})();
