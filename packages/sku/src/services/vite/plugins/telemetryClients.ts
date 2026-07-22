/**
 * Browser-side telemetry clients for Vite start.
 * Imported by the Vite SSR start-only client entry (not via transformIndexHtml).
 */
import {
  SKU_INITIAL_PAGE_LOAD_EVENT,
  SKU_VITE_HMR_EVENT,
} from './telemetryEvents.js';

/** Measure initial page load and notify the Vite server over HMR. */
export const installSkuPageLoadTelemetry = (): void => {
  addEventListener('load', () => {
    if (import.meta.hot) {
      import.meta.hot.send(SKU_INITIAL_PAGE_LOAD_EVENT);
    }
  });
};

/** Measure HMR update duration and notify the Vite server. */
export const installSkuHmrTelemetry = (): void => {
  const hot = import.meta.hot;
  if (!hot) {
    return;
  }

  hot.on('vite:beforeUpdate', () => {
    performance.mark('vite-hmr');
  });

  hot.on('vite:afterUpdate', (ctx) => {
    const update = ctx.updates[0];
    if (!update) {
      return;
    }
    const result = performance.measure('hmr-time', 'vite-hmr');

    hot.send(SKU_VITE_HMR_EVENT, {
      durationInMs: result.duration,
      timestamp: update.timestamp,
    });
  });
};

installSkuPageLoadTelemetry();
installSkuHmrTelemetry();
