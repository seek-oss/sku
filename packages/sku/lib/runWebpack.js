const statsConfig = require('../config/webpack/statsConfig');

/**
 * @param {import('webpack').Compiler} compiler
 * */
const run = async (compiler) => {
  return new Promise((resolve, reject) => {
    compiler.run((err, stats) => {
      if (err) {
        reject(err);
      }

      console.log(stats.toString(statsConfig));

      if (stats.hasErrors()) {
        reject('Sku build failed');
      }

      resolve();
    });
  });
};

module.exports = {
  run,
};
