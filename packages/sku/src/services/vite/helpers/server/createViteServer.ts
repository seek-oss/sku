import { middlewarePlugin } from '@/services/vite/plugins/middlewarePlugin.js';
import { createServer, mergeConfig } from 'vite';
import type { SkuContext } from '@/context/createSkuContext.js';

import { createViteClientConfig } from '../config/createConfig.js';
import { HMRTelemetryPlugin } from '@/services/vite/plugins/HMRTelemetry.js';
import { startTelemetryPlugin } from '../../plugins/startTelemetry.js';
import { getAppHosts } from '@/utils/contextUtils/hosts.js';
import { httpsDevServerPlugin } from '../../plugins/httpsDevServerPlugin.js';

export const createViteServer = async (skuContext: SkuContext) =>
  createServer(
    mergeConfig(createViteClientConfig(skuContext), {
      base: '/',
      skuContext,
      plugins: [
        middlewarePlugin(skuContext),
        startTelemetryPlugin({
          target: 'node',
          type: 'static',
        }),
        // eslint-disable-next-line new-cap
        HMRTelemetryPlugin({
          target: 'node',
          type: 'static',
        }),
        httpsDevServerPlugin(skuContext),
      ],
      server: {
        host: 'localhost',
        allowedHosts: getAppHosts(skuContext).filter(
          (host) => typeof host === 'string',
        ),
      },
    }),
  );
