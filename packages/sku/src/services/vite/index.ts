import { createServer, createBuilder } from 'vite';

import type { SkuContext } from '../../context/createSkuContext.js';

import { createConfig } from './helpers/config/createConfig.js';
import {
  cleanTargetDirectory,
  copyPublicFiles,
} from '../../utils/buildFileUtils.js';
import { createOutDir } from './helpers/bundleConfig.js';
import { getAppHosts } from '../../context/hosts.js';
import { prerenderConcurrently } from './helpers/prerender/prerenderConcurrently.js';
import allocatePort from '../../utils/allocatePort.js';
import { serverUrls } from '@sku-private/utils';
import { createDevSsrServer } from './ssr/createDevSsrServer.js';
import exists from '../../utils/exists.js';

export const viteService = {
  build: async (skuContext: SkuContext) => {
    const outDir = createOutDir(skuContext.paths.target);
    const isViteSsr =
      skuContext.bundler === 'vite' && skuContext.buildType === 'ssr';

    if (isViteSsr) {
      if (await exists(skuContext.paths.target)) {
        await cleanTargetDirectory(skuContext.paths.target);
      }
    }

    const builder = await createBuilder(createConfig(skuContext));

    // builds all environments in the order they are defined in the config
    await builder.buildApp();

    if (!isViteSsr && skuContext.routes) {
      await prerenderConcurrently(skuContext);
    }
    if (!isViteSsr) {
      await cleanTargetDirectory(outDir.ssg, true);
      await cleanTargetDirectory(outDir.join('.vite'), true);
    }
    await copyPublicFiles(
      isViteSsr
        ? { paths: { ...skuContext.paths, target: outDir.ssrClient } }
        : skuContext,
    );
  },
  start: async ({
    skuContext,
    environment,
  }: {
    skuContext: SkuContext;
    environment: string;
  }) => {
    const availablePort = await allocatePort({
      port: skuContext.port.client,
      strictPort: skuContext.port.strictPort,
    });

    const skuContextOverride = {
      ...skuContext,
      port: {
        ...skuContext.port,
        client: availablePort,
      },
    };

    const isViteSsr =
      skuContextOverride.bundler === 'vite' &&
      skuContextOverride.buildType === 'ssr';
    const viteServer = isViteSsr
      ? (
          await createDevSsrServer({
            skuContext: skuContextOverride,
            environment,
          })
        ).vite
      : await createServer(createConfig(skuContextOverride, environment));

    if (!isViteSsr) {
      await viteServer.listen(availablePort);
    }

    const hosts = getAppHosts(skuContextOverride);

    console.log('Starting development server...');
    const urls = serverUrls({
      hosts,
      port: availablePort,
      initialPath: skuContextOverride.initialPath,
      https: skuContext.httpsDevServer,
    });

    if (skuContextOverride.listUrls) {
      urls.printAll();
    } else {
      urls.print();
    }

    viteServer.bindCLIShortcuts({ print: true });
  },
};
