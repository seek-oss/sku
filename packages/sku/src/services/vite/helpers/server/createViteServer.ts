import { skuViteMiddlewarePlugin } from '@/services/vite/plugins/skuViteMiddlewarePlugin.js';
import { createServer } from 'vite';
import type { SkuContext } from '@/context/createSkuContext.js';

import { createViteConfig } from '../createConfig.js';
import skuViteHMRTelemetryPlugin from '@/services/vite/plugins/skuViteHMRTelemetry.js';
import { skuViteStartTelemetryPlugin } from '../../plugins/skuViteStartTelemetry.js';
import { getAppHosts } from '@/utils/contextUtils/hosts.js';
import { getHttpsDevServerPlugin } from '../../plugins/skuViteHttpsDevServer.js';

export const createViteServer = async (skuContext: SkuContext) =>
  createServer({
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
        getHttpsDevServerPlugin(skuContext),
      ],
    }),
    server: {
      host: 'localhost',
      allowedHosts: getAppHosts(skuContext).filter(
        (host) => typeof host === 'string',
      ),
    },
  });
