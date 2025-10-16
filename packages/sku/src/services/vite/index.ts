import { build, createServer } from 'vite';

import type { SkuContext } from '../../context/createSkuContext.js';

import {
  createClientBuildConfig,
  createServerBuildConfig,
  createStartConfig,
} from './helpers/config/createConfig.js';
import { cleanTargetDirectory } from '../../utils/buildFileUtils.js';
import { createOutDir } from './helpers/bundleConfig.js';
import { getAppHosts } from '../../context/hosts.js';
import { prerenderConcurrently } from './helpers/prerender/prerenderConcurrently.js';
import allocatePort from '../../utils/allocatePort.js';
import { printUrls } from '@sku-lib/utils';

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
      strictPort: skuContext.port.strictPort,
    });

    await server.listen(availablePort);

    const hosts = getAppHosts(skuContext);
    printUrls(hosts, {
      https: skuContext.httpsDevServer,
      initialPath: skuContext.initialPath,
      port: availablePort,
    });

    server.bindCLIShortcuts({ print: true });
  },
};
