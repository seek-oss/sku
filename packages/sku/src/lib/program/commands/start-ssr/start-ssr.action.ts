import path from 'node:path';
import WebpackDevServer, { type Configuration } from 'webpack-dev-server';
import webpack from 'webpack';
import onDeath from 'death';
import chalk from 'chalk';
import debug from 'debug';

import getCertificate from '../../../certificate.js';
import {
  copyPublicFiles,
  ensureTargetDirectory,
  cleanTargetDirectory,
} from '../../../buildFileUtils.js';
import { checkHosts, getAppHosts } from '../../../hosts.js';
import {
  port,
  initialPath,
  paths,
  httpsDevServer,
} from '../../../../context/index.js';
import makeWebpackConfig from '../../../../config/webpack/webpack.config.ssr.js';
import getStatsConfig from '../../../../config/webpack/statsConfig.js';
import allocatePort from '../../../allocatePort.js';
import openBrowser from '../../../openBrowser/index.js';
import createServerManager from '../../../serverManager.js';

import { watchVocabCompile } from '../../../runVocab.js';
import {
  configureProject,
  validatePeerDeps,
} from '../../../utils/configure.js';
import type { StatsChoices } from '../../options/stats/stats.option.js';

const log = debug('sku:start-ssr');

process.env.NODE_ENV = 'development';

const hot = process.env.SKU_HOT !== 'false';

const pluginName = 'sku-start-ssr';
const localhost = '0.0.0.0';

const once = (fn: (...args: any[]) => void) => {
  let called = false;
  let result: unknown;

  return (...fnArgs: any[]) => {
    if (!called) {
      result = fn(...fnArgs);
      called = true;
    }

    return result;
  };
};

export const startSsrAction = async ({
  stats: statsOption,
}: {
  stats: StatsChoices;
}) => {
  await configureProject();
  validatePeerDeps();
  await watchVocabCompile();

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
    isStartScript: true,
    stats: statsOption,
  });

  await checkHosts();

  const appHosts = getAppHosts() as string | string[] | undefined;

  // Make sure target directory exists before starting
  await ensureTargetDirectory();
  await cleanTargetDirectory();
  await copyPublicFiles();

  const clientCompiler = webpack(clientWebpackConfig);
  const serverCompiler = webpack(serverWebpackConfig);

  const serverManager = createServerManager(
    path.join(paths.target, 'server.js'),
  );

  const proto = httpsDevServer ? 'https' : 'http';

  const serverUrl = `${proto}://${appHosts?.[0]}:${serverPort}${initialPath}`;
  const webpackDevServerUrl = `${proto}://${appHosts?.[0]}:${clientPort}`;

  console.log();
  console.log(
    chalk.blue(
      `Starting the webpack dev server on ${chalk.underline(webpackDevServerUrl)}`,
    ),
  );
  console.log(
    chalk.blue(
      `Starting the SSR development server on ${chalk.underline(serverUrl)}`,
    ),
  );
  console.log();

  const onServerDone = once((err, stats) => {
    if (err) {
      console.error(err);
    }

    console.log(
      stats.toString(
        getStatsConfig({
          stats: statsOption,
          isStartScript: true,
        }),
      ),
    );

    if (err || stats.hasErrors()) {
      process.exit(1);
    }

    serverManager.start();

    openBrowser(serverUrl);
  });

  // Starts the server webpack config running.
  // We only want to do this once as it runs in watch mode
  const startServerWatch = once(() => {
    serverCompiler.watch({}, onServerDone);
  });

  // Make sure the client webpack config is complete before
  // starting the server build. The server relies on the client assets.
  clientCompiler.hooks.afterEmit.tap(pluginName, () => {
    startServerWatch();
  });

  serverCompiler.hooks.done.tap(pluginName, () => {
    serverManager.hotUpdate();
  });

  const devServerConfig: Configuration = {
    host: localhost,
    port: clientPort,
    allowedHosts: appHosts,
    hot,
    headers: { 'Access-Control-Allow-Origin': '*' },
    client: {
      overlay: false,
      webSocketURL: {
        hostname: appHosts?.[0],
        port: clientPort,
      },
    },
    setupExitSignals: true,
  };

  if (httpsDevServer) {
    const pems = await getCertificate();
    devServerConfig.server = {
      type: 'https',
      options: {
        key: pems,
        cert: pems,
      },
    };
  }

  // Start webpack dev server using only the client config
  const devServer = new WebpackDevServer(devServerConfig, clientCompiler);

  devServer.startCallback((err) => {
    if (err) {
      console.log(err);
      return;
    }
  });

  onDeath(() => {
    serverManager.kill();

    serverCompiler.close(() => {
      log('Server compiler closed');
    });
  });
};
