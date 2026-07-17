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

const printServerUrls = ({
  skuContext,
  port,
}: {
  skuContext: SkuContext;
  port: number;
}) => {
  const hosts = getAppHosts(skuContext);

  console.log('Starting development server...');
  const urls = serverUrls({
    hosts,
    port,
    initialPath: skuContext.initialPath,
    https: skuContext.httpsDevServer,
  });

  if (skuContext.listUrls) {
    urls.printAll();
  } else {
    urls.print();
  }
};

export const viteService = {
  build: async (skuContext: SkuContext) => {
    const outDir = createOutDir(skuContext.paths.target);
    const isSsr = skuContext.buildType === 'ssr';

    if (isSsr) {
      if (await exists(skuContext.paths.target)) {
        await cleanTargetDirectory(skuContext.paths.target);
      }

      const builder = await createBuilder(createConfig(skuContext));
      await builder.buildApp();

      await copyPublicFiles({
        paths: { ...skuContext.paths, target: outDir.ssrClient },
      });
      return;
    }

    const builder = await createBuilder(createConfig(skuContext));
    await builder.buildApp();

    if (skuContext.routes) {
      await prerenderConcurrently(skuContext);
    }
    await cleanTargetDirectory(outDir.ssg, true);
    await cleanTargetDirectory(outDir.join('.vite'), true);
    await copyPublicFiles(skuContext);
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

    if (skuContextOverride.buildType === 'ssr') {
      const { vite } = await createDevSsrServer({
        skuContext: skuContextOverride,
        environment,
      });

      printServerUrls({
        skuContext: skuContextOverride,
        port: availablePort,
      });
      vite.bindCLIShortcuts({ print: true });
      return;
    }

    const viteServer = await createServer(
      createConfig(skuContextOverride, environment),
    );
    await viteServer.listen(availablePort);

    printServerUrls({
      skuContext: skuContextOverride,
      port: availablePort,
    });
    viteServer.bindCLIShortcuts({ print: true });
  },
};
