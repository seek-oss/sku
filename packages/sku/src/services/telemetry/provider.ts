import { createRequire } from 'node:module';

import { banner, getAddCommand } from '@sku-lib/utils';

import _debug from 'debug';

const require = createRequire(import.meta.url);

const debug = _debug('sku:telemetry');
const noopDebug =
  (functionName: string) =>
  (...args: unknown[]) => {
    debug("noop telemetry call '%s' with data: %O", functionName, args);
  };

type MetricName =
  | 'build'
  | 'serve'
  | 'setup_hosts'
  | 'start.webpack.initial'
  | 'start.webpack.rebuild'
  | 'certificate.generate'
  | 'duplicate_compile_package'
  | 'peer_dep_version_mismatch';
type TagMap = Record<string, string | number | boolean>;

interface TelemetryProvider {
  count: (metricName: MetricName, tagMap?: TagMap, increment?: number) => void;
  timing: (metricName: MetricName, duration: number, tagMap?: TagMap) => void;
  gauge: (metricName: MetricName, duration: number, tagMap?: TagMap) => void;
  addGlobalTags: (tagMap: TagMap) => void;
  close: () => Promise<void>;
  isRealProvider: boolean;
}

let provider: TelemetryProvider = {
  count: noopDebug('count'),
  timing: noopDebug('timing'),
  gauge: noopDebug('gauge'),
  addGlobalTags: noopDebug('addGlobalTags'),
  close: () => Promise.resolve(),
  isRealProvider: false,
};

try {
  if (process.env.SKU_TELEMETRY !== 'false') {
    // Consumers install this private dependency
    // eslint-disable-next-line import-x/no-unresolved
    const realProvider = require('@seek/sku-telemetry').default(
      {},
    ) as TelemetryProvider;

    // For backwards compat with older versions of @seek/sku-telemetry
    if (typeof realProvider.gauge !== 'function') {
      realProvider.gauge = noopDebug('gauge');
    }

    provider = realProvider;
    // we now know that telemetry is enabled
    provider.isRealProvider = true;
  }
} catch {
  debug(
    '@seek/sku-telemetry not installed, falling back to noop telemetry provider',
  );

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
