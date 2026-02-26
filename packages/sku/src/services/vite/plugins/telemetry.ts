import type { Plugin } from 'vite';
import js from 'dedent';
import debug from 'debug';
import provider from '../../telemetry/index.js';
import { metricsMeasurers } from '../../telemetry/metricsMeasurers.js';
import { makePluginName } from '../helpers/makePluginName.js';

type ViteHmrTimePayload = { durationInMs: number; timestamp: number };

const log = debug('sku:metrics');
const customHmrEvent = 'sku:vite-hmr' as const;
const initialPageLoadEvent = 'sku:initialPageLoad' as const;

type TelemetryOptions = {
  target: string;
  type: string;
};

export const telemetryPlugin = ({ target, type }: TelemetryOptions): Plugin => {
  const hmrUpdateTimestamps = new Set<number>();

  return {
    apply: 'serve',
    name: makePluginName('telemetry'),
    transformIndexHtml: {
      order: 'pre',
      handler: () => [
        {
          tag: 'script',
          attrs: {
            type: 'module',
          },
          children: skuPageLoadTelemetryClient,
          injectTo: 'head',
        },
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
    configureServer(server) {
      server.ws.on(
        initialPageLoadEvent,
        handleInitialPageLoadEvent({ target, type }),
      );

      server.ws.on(
        customHmrEvent,
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
 */
const skuPageLoadTelemetryClient = js /* js */ `
  addEventListener("load", () => {
    if (import.meta.hot) {
      import.meta.hot.send('${initialPageLoadEvent}');
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

    provider.timing('start.vite.initial', initialStartTime, tags);
  }
};

/**
 * This client script is used to measure the HMR time.
 */
const skuHmrTelemetryClient = js /* js */ `
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

const handleCustomHmrEvent =
  (timestamps: Set<number>, tags: Record<string, string>) =>
  (data: ViteHmrTimePayload) => {
    const { durationInMs, timestamp } = data;

    // Only send telemetry for one update per HMR update timestamp as multiple clients may be connected
    if (timestamps.has(timestamp)) {
      timestamps.delete(timestamp);

      log('HMR update completed in %dms', durationInMs);
      provider.timing('start.vite.rebuild', durationInMs, tags);
    }
  };
