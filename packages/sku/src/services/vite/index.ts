import { createServer, createBuilder } from 'vite';

import type { SkuContext } from '../../context/createSkuContext.js';

import { createConfig } from './helpers/config/createConfig.js';
import { cleanTargetDirectory } from '../../utils/buildFileUtils.js';
import { createOutDir } from './helpers/bundleConfig.js';
import { getAppHosts } from '../../context/hosts.js';
import { prerenderConcurrently } from './helpers/prerender/prerenderConcurrently.js';
import allocatePort from '../../utils/allocatePort.js';
import { serverUrls } from '@sku-private/utils';

export const viteService = {
  build: async (skuContext: SkuContext) => {
    const outDir = createOutDir(skuContext.paths.target);
    const builder = await createBuilder(createConfig(skuContext));

    // builds all environments in the order they are defined in the config
    await builder.buildApp();

    if (skuContext.routes) {
      await prerenderConcurrently(skuContext);
    }
    await cleanTargetDirectory(outDir.ssg, true);
    await cleanTargetDirectory(outDir.join('.vite'), true);
  },
  start: async ({
    skuContext,
    environment,
  }: {
    skuContext: SkuContext;
    environment: string;
  }) => {
    const server = await createServer(createConfig(skuContext, environment));

    const availablePort = await allocatePort({
      port: skuContext.port.client,
      strictPort: skuContext.port.strictPort,
    });

    await server.listen(availablePort);

    const hosts = getAppHosts(skuContext);

    console.log('Starting development server...');
    const urls = serverUrls({
      hosts,
      port: availablePort,
      initialPath: skuContext.initialPath,
      https: skuContext.httpsDevServer,
    });

    if (skuContext.listUrls) {
      urls.printAll();
    } else {
      urls.print();
    }

    server.bindCLIShortcuts({ print: true });
  },
  startSsr: async (skuContext: SkuContext) => {
    const server = await createServer(createConfig(skuContext));

    const availablePort = await allocatePort({
      port: skuContext.port.client,
      strictPort: skuContext.port.strictPort,
    });

    await server.listen(availablePort);

    const hosts = getAppHosts(skuContext);

    console.log('Starting development server...');
    const urls = serverUrls({
      hosts,
      port: availablePort,
      initialPath: skuContext.initialPath,
      https: skuContext.httpsDevServer,
    });

    if (skuContext.listUrls) {
      urls.printAll();
    } else {
      urls.print();
    }

    server.bindCLIShortcuts({ print: true });
  },
};
