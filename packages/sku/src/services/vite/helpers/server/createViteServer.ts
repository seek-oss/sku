import { createServer } from 'vite';
import { skuViteMiddlewarePlugin } from '@/services/vite/plugins/skuViteMiddlewarePlugin.js';
import type { SkuContext } from '@/context/createSkuContext.js';

import { createViteConfig } from '../createConfig.js';
import skuViteHMRTelemetryPlugin from '@/services/vite/plugins/skuViteHMRTelemetry.js';
import { skuViteStartTelemetryPlugin } from '../../plugins/skuViteStartTelemetry.js';
import { getAppHosts } from '@/utils/contextUtils/hosts.js';
import { skuViteHttpsDevServer } from '../../plugins/skuViteHttpsDevServer.js';

export const createViteServer = async (
  skuContext: SkuContext,
  convertLoadable?: boolean,
) => {
  const base = process.env.BASE || '/';

  return await createServer({
    ...createViteConfig({
      skuContext,
      convertLoadable,
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
        skuContext.httpsDevServer && skuViteHttpsDevServer(skuContext),
      ],
    }),
    server: {
      host: 'localhost',
      allowedHosts: getAppHosts(skuContext).filter(
        (host) => typeof host === 'string',
      ),
    },
    base,
  });
};
