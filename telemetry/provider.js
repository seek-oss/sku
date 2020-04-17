const banner = require('../lib/banner');

function noop() {}

let provider = {
  count: noop,
  timing: noop,
  addGlobalTags: noop,
  close: noop,
};

try {
  if (process.env.SKU_TELEMETRY !== 'false') {
    // eslint-disable-next-line import/no-unresolved
    provider = require('@seek/sku-telemetry').default({});
  }
} catch (e) {
  banner('warning', '@seek/sku-telemetry not installed', [
    'To help us improve sku, please install our private telemetry package that gives us insights on usage, errors and performance.',
    'yarn add --dev @seek/sku-telemetry',
    'Non SEEK based usage can disable this message with `SKU_TELEMETRY=false`',
  ]);
}

module.exports = provider;
