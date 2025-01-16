import { createServer } from '@/services/vite/serve.js';
import { SkuContext } from '@/context/createSkuContext.js';
import { createViteServer } from '@/services/vite/createViteServer.js';
import { build } from 'vite';
import { createViteConfig } from '@/services/vite/createConfig.js';
import { prerenderRoutes } from '@/services/vite/prerender.js';

export const viteService = {
  build: async (skuContext: SkuContext) => {
    await build(createViteConfig({ skuContext }));
  },
  buildSsg: async (skuContext: SkuContext) => {
    await build(createViteConfig({ skuContext, configType: 'ssg' }));
    if (skuContext.routes) {
      await prerenderRoutes(skuContext);
    }
  },
  buildSsr: async (skuContext: SkuContext) => {
    await build(createViteConfig({ skuContext, configType: 'ssr' }));
  },
  serve: async (skuContext: SkuContext) => {
    const isTest = process.env.VITEST;

    process.env.NODE_ENV = 'production';

    // TODO: This should serve SSG content. It currently serves SSR content.
    // If you want SSR content it should be done via start.

    if (!isTest) {
      createServer({
        skuContext,
        isProduction: process.env.NODE_ENV === 'production',
      }).then(({ app }) =>
        app.listen(skuContext.port.server, () => {
          console.log(`http://localhost:${skuContext.port.server}`);
        }),
      );
    }
  },
  start: async (skuContext: SkuContext) => {
    const isTest = process.env.VITEST;

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
    const isTest = process.env.VITEST;

    process.env.NODE_ENV = 'development';

    if (!isTest) {
      createServer({
        skuContext,
        isProduction: false,
      }).then(({ app }) =>
        app.listen(skuContext.port.server, () => {
          console.log(`http://localhost:${skuContext.port.server}`);
        }),
      );
    }
  },
  createIndex: async () => {},
};
