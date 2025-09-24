import debug from 'debug';

const log = debug('sku:metrics');

const skuStartMarkName = 'skuStartComplete';
const skuStart = {
  mark: () => {
    performance.mark(skuStartMarkName);
  },
  measure: () => {
    const result = performance.measure('skuStart', { end: skuStartMarkName });

    log(`Sku dev server start took ${Math.round(result.duration)}ms`);

    return result;
  },
};

const initialPageLoadMarkName = 'initialPageLoadStart';
const initialPageLoad = {
  mark: () => {
    performance.mark(initialPageLoadMarkName);
  },
  isInitialPageLoad: true,
  openTab: process.env.OPEN_TAB !== 'false',
  measure() {
    this.isInitialPageLoad = false;

    const result = performance.measure('initialPageLoad', {
      start: initialPageLoadMarkName,
    });

    log(`Initial page load took ${Math.round(result.duration)}ms`);

    return result;
  },
};

export const metricsMeasurers = {
  skuStart,
  initialPageLoad,
};
