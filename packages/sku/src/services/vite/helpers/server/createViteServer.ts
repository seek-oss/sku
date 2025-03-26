import { createServer } from 'vite';
import { skuViteMiddlewarePlugin } from '@/services/vite/plugins/skuViteMiddlewarePlugin.js';
import type { SkuContext } from '@/context/createSkuContext.js';

import { createViteConfig } from '../createConfig.js';
import skuViteHMRTelemetryPlugin from '@/services/vite/plugins/skuViteHMRTelemetry.js';
import { skuViteStartTelemetryPlugin } from '../../plugins/skuViteStartTelemetry.js';

export const createViteServer = async (skuContext: SkuContext) => {
  const base = process.env.BASE || '/';

  return await createServer({
    ...createViteConfig({
      skuContext,
      plugins: [
        skuViteMiddlewarePlugin(skuContext),
        skuViteStartTelemetryPlugin({
          target: 'node',
          type: 'static',
        }),
        skuViteHMRTelemetryPlugin({
          target: 'node',
          type: 'static',
        }),
      ],
    }),
    server: {
      allowedHosts: skuContext.sites
        .map(({ host }) => host || false)
        .filter((host) => typeof host === 'string'),
    },
    base,
  });
};
