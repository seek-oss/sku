function noop() {}

let provider = {
  count: noop,
  timing: noop,
  addGlobalTags: noop,
  close: noop,
};

try {
  if (process.env.TELEMETRY !== 'false') {
    provider = require('@seek/sku-telemetry').default({});
  }
} catch (e) {
  // No telemetry available
}

module.exports = provider;
