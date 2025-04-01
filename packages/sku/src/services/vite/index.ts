import { build } from 'vite';
import type { SkuContext } from '@/context/createSkuContext.js';

import { createViteServer } from './helpers/server/createViteServer.js';
import { createViteServerSsr } from './helpers/server/createViteServerSsr.js';
import { createViteConfig } from './helpers/createConfig.js';
import { prerenderRoutes } from './helpers/prerenderRoutes.js';
import { cleanTargetDirectory } from '@/utils/buildFileUtils.js';
import { openBrowser } from '@/openBrowser/index.js';
import { getAppHosts } from '@/utils/contextUtils/hosts.js';

export const viteService = {
  buildSsr: async (skuContext: SkuContext) => {
    // TODO: This isn't fully implemented?
    await build(createViteConfig({ skuContext }));
  },
  build: async (skuContext: SkuContext, convertLoadable?: boolean) => {
    await build(createViteConfig({ skuContext, convertLoadable }));
    await build(
      createViteConfig({ skuContext, convertLoadable, configType: 'ssg' }),
    );
    if (skuContext.routes) {
      await prerenderRoutes(skuContext);
    }
    // await cleanTargetDirectory(`${process.cwd()}/dist/render`, true);
    // await cleanTargetDirectory(`${process.cwd()}/dist/.vite`, true);
  },
  start: async (skuContext: SkuContext, convertLoadable?: boolean) => {
    // TODO Get this to be backwards compat with webpack
    const server = await createViteServer(skuContext, convertLoadable);
    await server.listen(skuContext.port.client);

    const hosts = getAppHosts(skuContext);
    const proto = skuContext.httpsDevServer ? 'https' : 'http';
    const url = `${proto}://${hosts[0]}:${skuContext.port.client}${skuContext.initialPath}`;
    openBrowser(url);

    if (skuContext.sites.length > 1) {
      skuContext.sites.forEach((site) => {
        console.log(
          `Running ${site.name} on '${proto}://${site.host ?? 'localhost'}:${skuContext.port.client}'`,
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
    server.listen(skuContext.port.server);

    const hosts = getAppHosts(skuContext);
    const proto = skuContext.httpsDevServer ? 'https' : 'http';
    const url = `${proto}://${hosts[0]}:${skuContext.port.server}${skuContext.initialPath}`;
    openBrowser(url);

    if (skuContext.sites.length > 1) {
      skuContext.sites.forEach((site) => {
        console.log(
          `Running ${site.name} on '${proto}://${site.host ?? 'localhost'}:${skuContext.port.server}'`,
        );
      });
    } else {
      console.log(`Running on 'http://localhost:${skuContext.port.server}'`);
    }
  },
};
