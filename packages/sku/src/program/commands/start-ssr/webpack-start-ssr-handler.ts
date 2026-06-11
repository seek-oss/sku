import path from 'node:path';
import WebpackDevServer, { type Configuration } from 'webpack-dev-server';
import webpack from 'webpack';
import onDeath from 'death';
import debug from 'debug';

import getCertificate from '../../../utils/certificate.js';

import {
  copyPublicFiles,
  ensureTargetDirectory,
  cleanTargetDirectory,
} from '../../../utils/buildFileUtils.js';
import {
  checkHosts,
  getAppHosts,
  withHostile,
} from '../../../context/hosts.js';
import { makeWebpackConfig } from '../../../services/webpack/config/webpack.config.ssr.js';
import getStatsConfig from '../../../services/webpack/config/statsConfig.js';
import allocatePort from '../../../utils/allocatePort.js';
import { openBrowser } from '../../../openBrowser.js';
import { createServerManager } from '../../../services/serverManager.js';

import { watchVocabCompile } from '../../../services/vocab/runVocab.js';
import {
  configureProject,
  validatePeerDeps,
} from '../../../utils/configure.js';
import type { StatsChoices } from '../../options/stats.option.js';
import type { SkuContext } from '../../../context/createSkuContext.js';
import { requireFromCwd, serverUrls } from '@sku-private/utils';

const log = debug('sku:start-ssr');

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

export const webpackStartSsrHandler = async ({
  stats: statsOption,
  skuContext,
}: {
  stats: StatsChoices;
  skuContext: SkuContext;
}) => {
  process.env.NODE_ENV = 'development';
  const { port, initialPath, paths, httpsDevServer, hosts } = skuContext;
  const { type } = requireFromCwd('./package.json');
  await configureProject(skuContext);
  validatePeerDeps(skuContext);
  await watchVocabCompile(skuContext);

  const devServerPort = await allocatePort({
    port: port.server,
    host: localhost,
    strictPort: port.strictPort,
  });
  const nodeServerPort = await allocatePort({
    port: port.client,
    host: localhost,
    strictPort: port.strictPort,
  });

  const [clientWebpackConfig, serverWebpackConfig] = await makeWebpackConfig({
    serverPort: nodeServerPort,
    isDevServer: true,
    hot,
    isStartScript: true,
    stats: statsOption,
    skuContext,
  });

  await withHostile(checkHosts)(skuContext);

  const appHosts = getAppHosts(skuContext);

  // Make sure target directory exists before starting
  await ensureTargetDirectory(skuContext.paths.target);
  await cleanTargetDirectory(skuContext.paths.target);
  await copyPublicFiles(skuContext);

  const clientCompiler = webpack(clientWebpackConfig);
  const serverCompiler = webpack(serverWebpackConfig);

  if (!clientCompiler) {
    throw new Error('Failed to create client webpack compiler');
  }

  if (!serverCompiler) {
    throw new Error('Failed to create server webpack compiler');
  }

  const serverManager = createServerManager(
    path.join(paths.target, `server.${type === 'module' ? 'c' : ''}js`),
  );

  const urls = serverUrls({
    hosts: appHosts,
    port: devServerPort,
    initialPath,
    https: httpsDevServer,
  });

  console.log('Starting development server...');
  if (skuContext.listUrls) {
    urls.printAll();
  } else {
    urls.print();
  }
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

    openBrowser(urls.first());
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

  const proto = httpsDevServer ? 'https' : 'http';
  const nodeServerUrl = `${proto}://127.0.0.1:${nodeServerPort}`;

  const devServerConfig: Configuration = {
    host: localhost,
    port: devServerPort,
    allowedHosts: appHosts,
    hot,
    devMiddleware: {
      // Disable serving an index file so document requests (including `/`) fall
      // through to the proxy and are rendered by the SSR server
      index: false,
    },
    proxy: [
      {
        // Proxy everything the dev server doesn't serve itself (i.e. anything
        // that isn't a webpack asset) to the internal SSR server. Webpack
        // assets are handled by `webpack-dev-middleware`, which runs first.
        context: () => true,
        target: nodeServerUrl,
        // The SSR server may be served over https in dev; don't reject its
        // self-signed certificate
        secure: false,
        // Preserve the original Host header so the SSR server's host-based
        // routing (sites) continues to work.
        changeOrigin: false,
      },
    ],
    client: {
      overlay: false,
      // The HMR websocket is served by this dev server (the front door), so the
      // browser connects directly to it.
      webSocketURL: {
        hostname: appHosts?.[0],
        port: devServerPort,
      },
    },
    setupExitSignals: true,
  };

  if (httpsDevServer) {
    const pems = await getCertificate('.ssl', hosts);
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
