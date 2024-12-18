import { createRequire } from 'node:module';

import { getAddCommand } from '../services/packageManager/packageManager.js';
import banner from '../lib/banner.js';

const require = createRequire(import.meta.url);

function noop() {}

type TagMap = Record<string, string | number | boolean>;

interface TelemetryProvider {
  count: (path: string, tagMap?: TagMap, increment?: number) => void;
  timing: (path: string, duration: number, tagMap?: TagMap) => void;
  close: () => Promise<void>;
  gauge: (path: string, duration: number, tagMap?: TagMap) => void;
  addGlobalTags: (tagMap: TagMap) => void;
}

let provider: TelemetryProvider = {
  count: noop,
  timing: noop,
  addGlobalTags: noop,
  gauge: noop,
  close: () => Promise.resolve(),
};

try {
  if (process.env.SKU_TELEMETRY !== 'false') {
    // Consumers install this private dependency
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

export default provider;
