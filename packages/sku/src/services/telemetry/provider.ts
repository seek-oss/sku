import { createRequire } from 'node:module';

import { getAddCommand } from '@sku-private/utils';
import { banner } from '@sku-private/utils/console';

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
  | 'start.initial'
  | 'start.rebuild'
  | 'certificate.generate'
  | 'duplicate_compile_package'
  | 'peer_dep_version_mismatch'
  | 'unnecessary_polyfill';
type TagMap = Record<string, string | number | boolean>;

/**
 * Computes a set of global tags. Deferred so that potentially expensive work
 * (e.g. reading `package.json` from the cwd) only runs if telemetry is actually
 * enabled and used.
 */
type GlobalTagsProvider = () => TagMap;

interface TelemetryProvider {
  count: (metricName: MetricName, tagMap?: TagMap, increment?: number) => void;
  timing: (metricName: MetricName, duration: number, tagMap?: TagMap) => void;
  gauge: (metricName: MetricName, duration: number, tagMap?: TagMap) => void;
  addGlobalTags: (tagMap: TagMap) => void;
  close: () => Promise<void>;
  isRealProvider: boolean;
}

const createNoopProvider = (): TelemetryProvider => ({
  count: noopDebug('count'),
  timing: noopDebug('timing'),
  gauge: noopDebug('gauge'),
  addGlobalTags: noopDebug('addGlobalTags'),
  close: () => Promise.resolve(),
  isRealProvider: false,
});

let innerProvider: TelemetryProvider = createNoopProvider();
const pendingGlobalTags: GlobalTagsProvider[] = [];
let resolved = false;

const flushPendingGlobalTags = () => {
  const tagsProviders = pendingGlobalTags.splice(0);

  // Only the real provider does anything with global tags, so skip computing
  // them entirely when telemetry is disabled or not installed.
  if (!innerProvider.isRealProvider) {
    return;
  }

  tagsProviders.forEach((getTags) => innerProvider.addGlobalTags(getTags()));
};

const resolveProvider = () => {
  if (resolved) {
    return;
  }
  resolved = true;

  if (process.env.SKU_TELEMETRY === 'false') {
    debug('Sku telemetry is disabled, skipping initialization');
    flushPendingGlobalTags();
    return;
  }

  try {
    // Consumers install this private dependency
    // eslint-disable-next-line import-x/no-unresolved
    const _mod = require('@seek/sku-telemetry');
    // Handle changes in module export style between v1.5.0 and v1.6.0
    const mod = _mod?.default ?? _mod;
    const realProvider = mod({}) as TelemetryProvider;

    // For backwards compat with older versions of @seek/sku-telemetry
    if (typeof realProvider.gauge !== 'function') {
      realProvider.gauge = noopDebug('gauge');
    }

    innerProvider = realProvider;
    innerProvider.isRealProvider = true;
  } catch {
    debug(
      '@seek/sku-telemetry not installed, falling back to noop telemetry provider',
    );

    const addCommand = getAddCommand({
      deps: ['@seek/sku-telemetry'],
      type: 'dev',
    });

    banner('caution', '@seek/sku-telemetry not installed', [
      'To help us improve sku, please install our private telemetry package that gives us insights on usage, errors and performance.',
      addCommand,
      'Non SEEK based usage can disable this message with `SKU_TELEMETRY=false`',
    ]);
  }

  flushPendingGlobalTags();
};

/**
 * Registers global tags to be applied to the telemetry provider. If the
 * provider hasn't been resolved yet, the tags are buffered and the (potentially
 * expensive) computation is deferred until the first metric is emitted.
 */
export const registerGlobalTags = (getTags: GlobalTagsProvider) => {
  if (!resolved) {
    pendingGlobalTags.push(getTags);
    return;
  }

  if (innerProvider.isRealProvider) {
    innerProvider.addGlobalTags(getTags());
  }
};

const provider: TelemetryProvider = {
  count: (...args) => {
    resolveProvider();
    innerProvider.count(...args);
  },
  timing: (...args) => {
    resolveProvider();
    innerProvider.timing(...args);
  },
  gauge: (...args) => {
    resolveProvider();
    innerProvider.gauge(...args);
  },
  addGlobalTags: (tagMap) => registerGlobalTags(() => tagMap),
  close: async () => {
    resolveProvider();
    await innerProvider.close();
  },
  get isRealProvider() {
    resolveProvider();
    return innerProvider.isRealProvider;
  },
};

export default provider;
