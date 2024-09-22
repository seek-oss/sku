const { getAddCommand } = require('../lib/packageManager');
const banner = require('../lib/banner');

function noop() {}

let provider = {
  count: noop,
  timing: noop,
  addGlobalTags: noop,
  gauge: noop,
  close: noop,
};

try {
  if (process.env.SKU_TELEMETRY !== 'false') {
    // eslint-disable-next-line import-x/no-unresolved
    const realProvider = require('@seek/sku-telemetry').default({});

    // For backwards compat with older versions of @seek/sku-telemetry
    if (typeof realProvider.gauge !== 'function') {
      realProvider.gauge = noop;
    }

    provider = realProvider;
  }
} catch {
  const addCommand = getAddCommand({
    deps: ['@seek/sku-telemetry'],
    type: 'dev',
  });

  banner('warning', '@seek/sku-telemetry not installed', [
    'To help us improve sku, please install our private telemetry package that gives us insights on usage, errors and performance.',
    addCommand,
    'Non SEEK based usage can disable this message with `SKU_TELEMETRY=false`',
  ]);
}

module.exports = provider;
