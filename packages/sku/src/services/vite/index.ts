import { createViteServer } from '@/services/vite/helpers/server/createViteServer.js';
import type { SkuContext } from '@/context/createSkuContext.js';
import { createViteServerSsr } from '@/services/vite/helpers/server/createViteServerSsr.js';

export const viteService = {
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
