import { createServer } from 'vite';
import { skuViteMiddlewarePlugin } from '@/services/vite/plugins/skuViteMiddlewarePlugin.js';
import type { SkuContext } from '@/context/createSkuContext.js';

import { createViteConfig } from '../createConfig.js';

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
