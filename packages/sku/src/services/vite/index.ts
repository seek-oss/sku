import { createViteServer } from '@/services/vite/createViteServer.js';
import type { SkuContext } from '@/context/createSkuContext.js';

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
};
