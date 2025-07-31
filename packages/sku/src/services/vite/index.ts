import { build, createServer } from 'vite';
import type { SkuContext } from '../../context/createSkuContext.js';

import {
  createClientBuildConfig,
  createServerBuildConfig,
  createStartConfig,
} from './helpers/config/createConfig.js';
import { cleanTargetDirectory } from '../../utils/buildFileUtils.js';
import { createOutDir } from './helpers/bundleConfig.js';
import { getAppHosts } from '../../utils/contextUtils/hosts.js';
import chalk from 'chalk';
import { prerenderConcurrently } from './helpers/prerender/prerenderConcurrently.js';
import allocatePort from '../../utils/allocatePort.js';

export const viteService = {
  build: async (skuContext: SkuContext) => {
    const outDir = createOutDir(skuContext.paths.target);
    await build(createClientBuildConfig(skuContext));
    await build(createServerBuildConfig(skuContext));
    if (skuContext.routes) {
      await prerenderConcurrently(skuContext);
    }
    await cleanTargetDirectory(outDir.ssg, true);
    await cleanTargetDirectory(outDir.join('.vite'), true);
  },
  start: async (skuContext: SkuContext) => {
    const server = await createServer(createStartConfig(skuContext));

    const availablePort = await allocatePort({
      port: skuContext.port.client,
      host: '0.0.0.0',
      strictPort: skuContext.port.strictPort,
    });

    await server.listen(availablePort);

    const hosts = getAppHosts(skuContext);
    printUrls(hosts, skuContext);

    server.bindCLIShortcuts({ print: true });
  },
};

const printUrls = (
  hosts: Array<string | undefined>,
  skuContext: SkuContext,
) => {
  const proto = skuContext.httpsDevServer ? 'https' : 'http';
  console.log('Starting development server...');
  hosts.forEach((site) => {
    const initialPath =
      skuContext.initialPath !== '/' ? skuContext.initialPath : '';
    const url = chalk.cyan(
      `${proto}://${site}:${chalk.bold(skuContext.port.client)}${initialPath}`,
    );
    console.log(`${chalk.green('➜')}  ${chalk.bold('Local')}: ${url}`);
  });
};
