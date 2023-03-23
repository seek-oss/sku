const { performance } = require('perf_hooks');
const prettyMilliseconds = require('pretty-ms');
const debug = require('debug')('sku:metrics');
const chalk = require('chalk');

const { persistentCache } = require('../../../../context');
const banner = require('../../../../lib/banner');
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
        debug('Initial "%s" build complete: %s', this.target, {
          toString: () => prettyMilliseconds(performance.now()),
        });
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
        const rebuildTime = performance.now() - this.startTime;
        debug('Rebuild for "%s" complete: %s', this.target, {
          toString: () => prettyMilliseconds(rebuildTime),
        });
        track.timing('start.webpack.rebuild', rebuildTime, {
          target: this.target,
          type: this.type,
        });
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

      if (persistentCache) {
        compilation.hooks.finishModules.tap(smp, () => {
          const internalTreatFiles = Array.from(this.builtTreatFiles).filter(
            (treatFile) => !treatFile.match(/node_modules|braid-design-system/),
          );

          if (internalTreatFiles.length > 0) {
            const treatFileNumMsg =
              internalTreatFiles.length > 1
                ? `${internalTreatFiles.length} treat files were`
                : `A treat file was`;

            banner(
              'error',
              `${treatFileNumMsg} detected within your project while using 'persistentCache' mode.`,
              [
                `Set '${chalk.bold(
                  'persistentCache: false',
                )}' in your sku.config.js until all treat files have been removed from the project.`,
              ],
            );
            process.exit(1);
          }
        });
      }
    });
  }
}

module.exports = MetricsPlugin;
