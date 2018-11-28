const chalk = require('chalk');
const { defaultClientEntry } = require('./clientEntries');

const exitWithError = message => {
  console.log(chalk.red(message));
  process.exit(1);
};

module.exports = skuConfig => {
  if (skuConfig.entry.library && !skuConfig.libraryName) {
    exitWithError(
      "Error: In your sku config, you've provided 'entry.library' without a corresponding 'libraryName' option. More details: https://github.com/seek-oss/sku#building-a-library"
    );
  }

  skuConfig.routes.forEach(({ name }) => {
    if (name === defaultClientEntry) {
      exitWithError(
        `Error: Invalid route name. '${defaultClientEntry}' is reserved, please use a different route name`
      );
    }
  });
};
