const { performance } = require('perf_hooks');

const track = require('../../../../telemetry');

const smp = 'sku-metrics-plugin';

class MetricsPlugin {
  constructor({ type, target }) {
    this.initial = true;
    this.target = target;
    this.type = type;
    this.builtTreatFiles = new Set();
    this.builtLessFiles = new Set();
  }

  apply(compiler) {
    compiler.hooks.watchRun.tap(smp, () => {
      this.startTime = performance.now();
    });

    compiler.hooks.done.tap(smp, () => {
      if (this.initial) {
        track.timing('start.webpack.initial', performance.now(), {
          target: this.target,
          type: this.type,
        });
        track.gauge('start.files.initial.treat', this.builtTreatFiles.size, {
          target: this.target,
          type: this.type,
        });
        track.gauge('start.files.initial.less', this.builtLessFiles.size, {
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
        track.gauge('start.files.rebuild.treat', this.builtTreatFiles.size, {
          target: this.target,
          type: this.type,
        });
        track.gauge('start.files.rebuild.less', this.builtLessFiles.size, {
          target: this.target,
          type: this.type,
        });
      }

      this.builtTreatFiles.clear();
      this.builtLessFiles.clear();
    });

    compiler.hooks.thisCompilation.tap(smp, (compilation) => {
      compilation.hooks.buildModule.tap(smp, (module) => {
        if (module.resource) {
          if (module.resource.endsWith('.treat.ts')) {
            this.builtTreatFiles.add(module.resource);
          } else if (module.resource.endsWith('.less')) {
            this.builtLessFiles.add(module.resource);
          }
        }
      });
    });
  }
}

module.exports = MetricsPlugin;
