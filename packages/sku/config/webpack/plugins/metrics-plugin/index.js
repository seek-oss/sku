import { performance } from 'node:perf_hooks';
import prettyMilliseconds from 'pretty-ms';
import debug from 'debug';
import provider from '../../../../telemetry/index.js';

const log = debug('sku:metrics');

const smp = 'sku-metrics-plugin';

class MetricsPlugin {
  constructor({ type, target }) {
    this.initial = true;
    this.target = target;
    this.type = type;
  }

  apply(compiler) {
    compiler.hooks.watchRun.tap(smp, () => {
      this.startTime = performance.now();
    });

    compiler.hooks.done.tap(smp, () => {
      if (this.initial) {
        log('Initial "%s" build complete: %s', this.target, {
          toString: () => prettyMilliseconds(performance.now()),
        });
        provider.rtiming('start.webpack.initial', performance.now(), {
          target: this.target,
          type: this.type,
        });

        this.initial = false;
      } else {
        const rebuildTime = performance.now() - this.startTime;
        log('Rebuild for "%s" complete: %s', this.target, {
          toString: () => prettyMilliseconds(rebuildTime),
        });
        provider.timing('start.webpack.rebuild', rebuildTime, {
          target: this.target,
          type: this.type,
        });
      }
    });
  }
}

export default MetricsPlugin;
