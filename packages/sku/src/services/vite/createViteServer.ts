import { skuViteMiddlewarePlugin } from '@/services/vite/plugins/skuViteMiddlewarePlugin.js';
import { createViteConfig } from '@/services/vite/createConfig.js';
import type { SkuContext } from '@/context/createSkuContext.js';
import { createServer } from 'vite';

export const createViteServer = async (skuContext: SkuContext) => {
  const base = process.env.BASE || '/';
  const root = process.cwd();

  return await createServer({
    ...createViteConfig({
      skuContext,
      plugins: [skuViteMiddlewarePlugin(skuContext)],
    }),
    server: {
      allowedHosts: skuContext.sites
        .map((site) => site.host ?? false)
        .filter((host) => typeof host === 'string'),
    },
    root,
    base,
  });
};
