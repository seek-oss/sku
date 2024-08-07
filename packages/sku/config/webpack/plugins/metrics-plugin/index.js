const { performance } = require('node:perf_hooks');
const prettyMilliseconds = require('pretty-ms');
const debug = require('debug')('sku:metrics');
const track = require('../../../../telemetry');

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
        debug('Initial "%s" build complete: %s', this.target, {
          toString: () => prettyMilliseconds(performance.now()),
        });
        track.timing('start.webpack.initial', performance.now(), {
          target: this.target,
          type: this.type,
        });

        this.initial = false;
      } else {
        const rebuildTime = performance.now() - this.startTime;
        debug('Rebuild for "%s" complete: %s', this.target, {
          toString: () => prettyMilliseconds(rebuildTime),
        });
        track.timing('start.webpack.rebuild', rebuildTime, {
          target: this.target,
          type: this.type,
        });
      }
    });
  }
}

module.exports = MetricsPlugin;
