const fs = require('node:fs');
const chalk = require('chalk');
const { fdir: Fdir } = require('fdir');

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
      .map(async (srcPath) =>
        new Fdir()
          .filter((file) => file.endsWith('.less'))
          .crawl(srcPath)
          .withPromise(),
      ),
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
