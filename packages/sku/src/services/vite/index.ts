import { build, createServer } from 'vite';
import { styleText } from 'node:util';
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

const printUrls = (
  hosts: Array<string | undefined>,
  opts: { https: boolean; initialPath: string; port: number },
) => {
  const proto = opts.https ? 'https' : 'http';
  console.log('Starting development server...');
  hosts.forEach((site) => {
    const initialPath = opts.initialPath !== '/' ? opts.initialPath : '';
    const url = styleText(
      'cyan',
      `${proto}://${site}:${styleText('bold', String(opts.port))}${initialPath}`,
    );
    console.log(
      `${styleText('green', '➜')}  ${styleText('bold', 'Local')}: ${url}`,
    );
  });
};
