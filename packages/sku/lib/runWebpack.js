// @ts-check
const getStatsConfig = require('../config/webpack/statsConfig');

/**
 * @param {import('webpack').Compiler} compiler
 * @param {object} [options]
 * @param {string} [options.stats]
 * @returns {Promise<void>}
 */
const run = async (compiler, { stats: statsOption } = {}) =>
  new Promise((resolve, reject) => {
    compiler.run((err, stats) => {
      if (err) {
        reject(err);
      }

      console.log(
        stats?.toString(
          getStatsConfig({
            stats: statsOption,
          }),
        ),
      );

      if (stats?.hasErrors()) {
        reject('Sku build failed');
      }

      resolve();
    });
  });

module.exports = {
  run,
};
