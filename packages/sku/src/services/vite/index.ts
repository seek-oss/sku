import { build } from 'vite';
import type { SkuContext } from '@/context/createSkuContext.js';

import { createViteServer } from './helpers/server/createViteServer.js';
import { createViteServerSsr } from './helpers/server/createViteServerSsr.js';
import { createViteConfig } from './helpers/createConfig.js';
import { cleanTargetDirectory } from '@/utils/buildFileUtils.js';
import { openBrowser } from '@/openBrowser/index.js';
import { getAppHosts } from '@/utils/contextUtils/hosts.js';
import chalk from 'chalk';
import { prerenderConcurrently } from '@/services/vite/helpers/prerender/prerenderConcurrently.js';
import allocatePort from '@/utils/allocatePort.js';

export const viteService = {
  buildSsr: async (skuContext: SkuContext) => {
    // TODO: This isn't fully implemented?
    await build(createViteConfig({ skuContext }));
  },
  build: async (skuContext: SkuContext) => {
    await build(createViteConfig({ skuContext }));
    await build(createViteConfig({ skuContext, configType: 'ssg' }));
    if (skuContext.routes) {
      await prerenderConcurrently(skuContext);
    }
    await cleanTargetDirectory(`${process.cwd()}/dist/render`, true);
    await cleanTargetDirectory(`${process.cwd()}/dist/.vite`, true);
  },
  start: async (skuContext: SkuContext) => {
    // TODO Get this to be backwards compat with webpack
    const server = await createViteServer(skuContext);

    const availablePort = await allocatePort({
      port: skuContext.port.client,
      host: '0.0.0.0',
      strictPort: skuContext.port.strictPort,
    });

    await server.listen(availablePort);

    const hosts = getAppHosts(skuContext);
    const proto = skuContext.httpsDevServer ? 'https' : 'http';
    const url = `${proto}://${hosts[0]}:${availablePort}${skuContext.initialPath}`;
    openBrowser(url);

    printUrls(hosts, skuContext);

    server.bindCLIShortcuts({ print: true });
  },
  startSsr: async (skuContext: SkuContext) => {
    process.env.NODE_ENV = 'development';

    const server = await createViteServerSsr({
      skuContext,
    });
    server.listen(skuContext.port.server);

    const hosts = getAppHosts(skuContext);
    const proto = skuContext.httpsDevServer ? 'https' : 'http';
    const url = `${proto}://${hosts[0]}:${skuContext.port.server}${skuContext.initialPath}`;
    openBrowser(url);

    printUrls(hosts, skuContext);
  },
};

const printUrls = (
  hosts: Array<string | undefined>,
  skuContext: SkuContext,
) => {
  const proto = skuContext.httpsDevServer ? 'https' : 'http';
  hosts.forEach((site) => {
    console.log(
      `${chalk.green('➜')}  ${chalk.bold('Local')}: ${chalk.cyan(`${proto}://${site}:${chalk.bold(skuContext.port.client)}`)}`,
    );
  });
};
