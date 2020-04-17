const { performance } = require('perf_hooks');

const track = require('../../../../telemetry');

class MetricsPlugin {
  constructor({ type, target }) {
    this.initial = true;
    this.target = target;
    this.type = type;
  }

  apply(compiler) {
    compiler.hooks.watchRun.tap('sku-metrics-plugin', () => {
      this.startTime = performance.now();
    });

    compiler.hooks.done.tap('sku-metrics-plugin', () => {
      if (this.initial) {
        track.timing('start.webpack.initial', performance.now(), {
          target: this.target,
          type: this.type,
        });
        this.initial = false;
      } else {
        track.timing(
          'start.webpack.rebuild',
          performance.now() - this.startTime,
          {
            target: this.target,
            type: this.type,
          },
        );
      }
    });
  }
}

module.exports = MetricsPlugin;
