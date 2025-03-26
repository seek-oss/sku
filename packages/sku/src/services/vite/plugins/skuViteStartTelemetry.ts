import type { Plugin } from 'vite';
import js from 'dedent';
import provider from '@/services/telemetry/index.js';
import { metricsMeasurers } from '@/services/telemetry/metricsMeasurers.js';

const initialPageLoadEventName = 'sku:initialPageLoad' as const;

export const skuViteStartTelemetryPlugin = ({
  target,
  type,
}: {
  target: string;
  type: string;
}): Plugin => ({
  name: 'vite-plugin-sku-server-middleware',
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
    ],
  },
  configureServer(server) {
    server.ws.on(initialPageLoadEventName, () => {
      if (metricsMeasurers.initialPageLoad.isInitialPageLoad) {
        const { duration: skuStartDuration } =
          metricsMeasurers.skuStart.measure();

        const { duration: initialLoadDuration } =
          metricsMeasurers.initialPageLoad.measure();

        const initialStartTime = skuStartDuration + initialLoadDuration;

        provider.timing('start.webpack.initial', initialStartTime, {
          target,
          type,
        });
      }
    });
  },
});

const skuPageLoadTelemetryClient = js/* js */ `
  addEventListener("load", () => {
    if (import.meta.hot) {
      import.meta.hot.send('${initialPageLoadEventName}');
    }
  })
`;
