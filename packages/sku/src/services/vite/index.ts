import { build } from 'vite';
import type { SkuContext } from '@/context/createSkuContext.js';

import { createViteServer } from './helpers/server/createViteServer.js';
import { createViteServerSsr } from './helpers/server/createViteServerSsr.js';
import { createViteConfig } from './helpers/createConfig.js';
import { prerenderRoutes } from './helpers/prerenderRoutes.js';
import { cleanTargetDirectory } from '@/utils/buildFileUtils.js';

export const viteService = {
  buildSsr: async (skuContext: SkuContext) => {
    await build(createViteConfig({ skuContext }));
  },
  build: async (skuContext: SkuContext) => {
    await build(createViteConfig({ skuContext }));
    await build(createViteConfig({ skuContext, configType: 'ssg' }));
    if (skuContext.routes) {
      await prerenderRoutes(skuContext);
    }
    await cleanTargetDirectory(`${process.cwd()}/dist/render`, true);
    await cleanTargetDirectory(`${process.cwd()}/dist/.vite`, true);
  },
  start: async (skuContext: SkuContext) => {
    const server = await createViteServer(skuContext);
    await server.listen(skuContext.port.client);

    if (skuContext.sites.length > 1) {
      skuContext.sites.forEach((site) => {
        console.log(
          `Running ${site.name} on 'http://${site.host}:${skuContext.port.client}'`,
        );
      });
    } else {
      server.printUrls();
    }
    server.bindCLIShortcuts({ print: true });
  },
  startSsr: async (skuContext: SkuContext) => {
    process.env.NODE_ENV = 'development';

    const server = await createViteServerSsr({
      skuContext,
    });

    await server.listen(skuContext.port.server);
    if (skuContext.sites.length > 1) {
      skuContext.sites.forEach((site) => {
        console.log(
          `Running ${site.name} on 'http://${site.host}:${skuContext.port.server}'`,
        );
      });
    } else {
      console.log(`Running on 'http://localhost:${skuContext.port.server}'`);
    }
  },
};
