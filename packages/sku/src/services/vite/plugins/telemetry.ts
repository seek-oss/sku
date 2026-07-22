import type { Plugin } from 'vite';
import js from 'dedent';
import { createDebug } from 'obug';
import provider from '../../telemetry/index.js';
import { metricsMeasurers } from '../../telemetry/metricsMeasurers.js';
import { makePluginName } from '../helpers/makePluginName.js';
import {
  SKU_INITIAL_PAGE_LOAD_EVENT,
  SKU_VITE_HMR_EVENT,
} from './telemetryEvents.js';

type ViteHmrTimePayload = { durationInMs: number; timestamp: number };

const log = createDebug('sku:metrics');

type TelemetryOptions = {
  target: string;
  type: string;
  /**
   * When false, skip transformIndexHtml script injection (Vite SSR delivers
   * clients via the browser client entry instead). Default true for static.
   */
  injectHtml?: boolean;
};

export const telemetryPlugin = ({
  target,
  type,
  injectHtml = true,
}: TelemetryOptions): Plugin => {
  const hmrUpdateTimestamps = new Set<number>();

  return {
    apply: 'serve',
    name: makePluginName('telemetry'),
    ...(injectHtml
      ? {
          transformIndexHtml: {
            order: 'pre' as const,
            handler: () => [
              {
                tag: 'script',
                attrs: {
                  type: 'module',
                },
                children: skuPageLoadTelemetryClient,
                injectTo: 'head' as const,
              },
              {
                tag: 'script',
                attrs: { type: 'module' },
                children: skuHmrTelemetryClient,
                injectTo: 'head' as const,
              },
            ],
          },
        }
      : {}),
    handleHotUpdate: {
      order: 'pre',
      handler: (ctx) => {
        hmrUpdateTimestamps.add(ctx.timestamp);
      },
    },
    configureServer(server) {
      server.ws.on(
        SKU_INITIAL_PAGE_LOAD_EVENT,
        handleInitialPageLoadEvent({ target, type }),
      );

      server.ws.on(
        SKU_VITE_HMR_EVENT,
        handleCustomHmrEvent(hmrUpdateTimestamps, {
          target,
          type,
        }),
      );
    },
  };
};

/**
 * This client script is used to measure the initial page load time.
 * Static Vite injects it via transformIndexHtml; Vite SSR imports telemetryClients.
 */
const skuPageLoadTelemetryClient = js /* js */ `
  addEventListener("load", () => {
    if (import.meta.hot) {
      import.meta.hot.send('${SKU_INITIAL_PAGE_LOAD_EVENT}');
    }
  })
`;

const handleInitialPageLoadEvent = (tags: Record<string, string>) => () => {
  if (
    metricsMeasurers.initialPageLoad.isInitialPageLoad &&
    metricsMeasurers.initialPageLoad.openTab
  ) {
    const { duration: skuStartDuration } = metricsMeasurers.skuStart.measure();

    const { duration: initialLoadDuration } =
      metricsMeasurers.initialPageLoad.measure();

    const initialStartTime = skuStartDuration + initialLoadDuration;

    provider.timing('start.initial', initialStartTime, tags);
  }
};

/**
 * This client script is used to measure the HMR time.
 * Static Vite injects it via transformIndexHtml; Vite SSR imports telemetryClients.
 */
const skuHmrTelemetryClient = js /* js */ `
  if (import.meta.hot) {
    import.meta.hot.on('vite:beforeUpdate', () => {
      performance.mark("vite-hmr");
    })

    import.meta.hot.on('vite:afterUpdate', (ctx) => {
      const result = performance.measure("hmr-time", "vite-hmr");
      const timestamp = ctx.updates[0].timestamp;

      import.meta.hot.send('${SKU_VITE_HMR_EVENT}', { durationInMs: result.duration, timestamp });
    })
  }
`;

const handleCustomHmrEvent =
  (timestamps: Set<number>, tags: Record<string, string>) =>
  (data: ViteHmrTimePayload) => {
    const { durationInMs, timestamp } = data;

    // Only send telemetry for one update per HMR update timestamp as multiple clients may be connected
    if (timestamps.has(timestamp)) {
      timestamps.delete(timestamp);

      log('HMR update completed in %dms', durationInMs);
      provider.timing('start.rebuild', durationInMs, tags);
    }
  };
