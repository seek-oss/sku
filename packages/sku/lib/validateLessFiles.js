const fs = require('fs');
const path = require('path');
const glob = require('fast-glob');
const chalk = require('chalk');

const printBanner = require('./banner');
const exists = require('./exists');
const { paths } = require('../context');

module.exports = async () => {
  const srcPathsExist = await Promise.all(
    paths.src.map(async (srcPath) => (await exists(srcPath)) && srcPath),
  );
  const lessFileGlobResults = await Promise.all(
    srcPathsExist
      .filter((srcPath) => srcPath && fs.statSync(srcPath).isDirectory())
      .map(async (srcPath) => await glob(path.join(srcPath, '**/*.less'))),
  );
  const srcHasLessFiles = lessFileGlobResults.some(
    (fileArray) => fileArray.length > 0,
  );
  if (srcHasLessFiles) {
    printBanner('warning', 'LESS styles detected', [
      `Support for ${chalk.bold('LESS')} has been deprecated.`,
      `${chalk.bold(
        'Vanilla Extract',
      )} is the preferred styling solution supported by ${chalk.bold(
        'sku',
      )}, and support for ${chalk.bold(
        'LESS',
      )} will be removed in a future release.`,
      `Consumers are encouraged to migrate to ${chalk.bold(
        'Vanilla Extract',
      )} at the earliest opportunity.`,
      'https://seek-oss.github.io/sku/#/./docs/styling?id=vanilla-extract',
    ]);
  }
};
