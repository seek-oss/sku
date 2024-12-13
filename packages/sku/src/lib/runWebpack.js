// @ts-check
import getStatsConfig from '../config/webpack/statsConfig.js';

/**
 * @param {import('webpack-dev-server').Compiler | import('webpack-dev-server').MultiCompiler} compiler
 * @param {object} [options]
 * @param {string} [options.stats]
 * @returns {Promise<void>}
 */
export const run = async (compiler, { stats: statsOption } = {}) =>
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
