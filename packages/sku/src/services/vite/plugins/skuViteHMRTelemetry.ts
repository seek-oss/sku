import type { Plugin } from 'vite';
import provider from '@/services/telemetry/index.js';
import debug from 'debug';
import js from 'dedent';

const log = debug('sku:metrics');

// Couldn't quite get the documented method for typing custom payloads working
// https://vite.dev/guide/api-plugin.html#typescript-for-custom-events
const customHmrEvent = 'sku:vite-hmr' as const;
type ViteHmrTimePayload = { durationInMs: number; timestamp: number };

export default function skuViteHMRTelemetryPlugin({
  target,
  type,
}: {
  target: string;
  type: string;
}): Plugin[] {
  const hmrUpdateTimestamps = new Set();

  return [
    {
      name: 'vite-plugin-sku-hmr-telemetry',
      transformIndexHtml: {
        // Vite needs to process the script in order to pick up the HMR context
        order: 'pre',
        handler: () => [
          {
            tag: 'script',
            attrs: { type: 'module' },
            children: skuHmrTelemetryClient,
            injectTo: 'head',
          },
        ],
      },
      handleHotUpdate: {
        order: 'pre',
        handler: (ctx) => {
          hmrUpdateTimestamps.add(ctx.timestamp);
        },
      },
      configureServer: (server) => {
        server.ws.on(customHmrEvent, (data: ViteHmrTimePayload) => {
          const { durationInMs, timestamp } = data;

          // Only send telemetry for one update per HMR update timestamp as multiple clients may be connected
          if (hmrUpdateTimestamps.has(timestamp)) {
            hmrUpdateTimestamps.delete(timestamp);

            log('HMR update completed in %dms', durationInMs);
            provider.timing('start.webpack.rebuild', durationInMs, {
              target,
              type,
            });
          }
        });
      },
    },
  ];
}

const skuHmrTelemetryClient = js/* js */ `
  if (import.meta.hot) {
    import.meta.hot.on('vite:beforeUpdate', () => {
      performance.mark("vite-hmr");
    })

    import.meta.hot.on('vite:afterUpdate', (ctx) => {
      const result = performance.measure("hmr-time", "vite-hmr");
      const timestamp = ctx.updates[0].timestamp;

      import.meta.hot.send('${customHmrEvent}', { durationInMs: result.duration, timestamp });
    })
  }
`;
