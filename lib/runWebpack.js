const { yellow } = require('chalk');
const debug = require('debug')('sku:webpack:compile');
const args = require('../config/args');

const done = (resolve, reject) => (err, stats) => {
  if (err || stats.hasErrors()) {
    reject(stats.toString('errors-only'));
  }

  if (stats.hasWarnings()) {
    const { warnings } = stats.toJson();
    console.warn(
      yellow(
        `Compiled with ${warnings.length} warnings. For more information re-run in debug mode: \`sku ${args.script} --debug\`.`,
      ),
    );
    warnings.forEach(debug);
  }

  resolve();
};

const run = async compiler => {
  return new Promise((resolve, reject) => {
    compiler.run(done(resolve, reject));
  });
};

const watch = async compiler => {
  return new Promise((resolve, reject) => {
    compiler.watch({}, done(resolve, reject));
  });
};

module.exports = {
  run,
  watch,
};
