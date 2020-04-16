const { performance } = require('perf_hooks');

const track = require('../../../../telemetry');

class MetricsPlugin {
  constructor({ prefix, target }) {
    this.initial = true;
    this.target = target;
    this.prefix = prefix;
  }

  apply(compiler) {
    compiler.hooks.watchRun.tap('sku-metrics-plugin', () => {
      this.startTime = performance.now();
    });

    compiler.hooks.done.tap('sku-metrics-plugin', () => {
      if (this.initial) {
        track.timing(`${this.prefix}.webpack.initial`, performance.now(), {
          target: this.target,
        });
        this.initial = false;
      } else {
        track.timing(
          `${this.prefix}.webpack.rebuild`,
          performance.now() - this.startTime,
          {
            target: this.target,
          },
        );
      }
    });
  }
}

module.exports = MetricsPlugin;
