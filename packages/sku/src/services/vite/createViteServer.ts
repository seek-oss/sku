import { skuViteMiddlewarePlugin } from '@/services/vite/plugins/skuViteMiddlewarePlugin.js';
import { createViteConfig } from '@/services/vite/createConfig.js';
import type { SkuContext } from '@/context/createSkuContext.js';
import { createServer } from 'vite';

export const createViteServer = async (skuContext: SkuContext) => {
  const base = process.env.BASE || '/';

  return await createServer({
    ...createViteConfig({
      skuContext,
      plugins: [skuViteMiddlewarePlugin(skuContext)],
    }),
    server: {
      allowedHosts: skuContext.sites
        .map(({ host }) => host || false)
        .filter((host) => typeof host === 'string'),
    },
    base,
  });
};
