import type { Plugin } from 'vite';
import provider from '@/services/telemetry/index.js';
import debug from 'debug';

const log = debug('sku:metrics');

export default function skuViteHMRTelemetryPlugin({
  target,
  type,
}: {
  target: string;
  type: string;
}): Plugin[] {
  let startTime = 0;

  return [
    {
      name: 'vite-plugin-sku-hmr-telemetry-pre',
      enforce: 'pre',
      handleHotUpdate: {
        order: 'pre',
        handler() {
          startTime = performance.now();
        },
      },
    },
    {
      name: 'vite-plugin-sku-hmr-telemetry-post',
      enforce: 'post',
      handleHotUpdate: {
        order: 'post',
        handler() {
          const rebuildTime = performance.now() - startTime;
          log('Rebuild complete: %s', {
            toString: () => `${Math.round(rebuildTime * 100) / 100}ms`,
          });
          provider.timing('start.webpack.rebuild', rebuildTime, {
            target,
            type,
          });
        },
      },
    },
  ];
}
