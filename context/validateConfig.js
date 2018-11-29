const browserslist = require('browserslist');
const chalk = require('chalk');
const { defaultClientEntry } = require('./clientEntries');

const exitWithError = message => {
  console.log(chalk.red(message));
  process.exit(1);
};

module.exports = skuConfig => {
  if (skuConfig.libraryEntry && !skuConfig.libraryName) {
    exitWithError(
      "Error: In your sku config, you've provided 'libraryEntry' without a corresponding 'libraryName' option. More details: https://github.com/seek-oss/sku#building-a-library"
    );
  }

  skuConfig.routes.forEach(({ name }) => {
    if (name === defaultClientEntry) {
      exitWithError(
        `Error: Invalid route name. '${defaultClientEntry}' is reserved, please use a different route name`
      );
    }
  });

  // Ensure supportedBrowsers is valid browserslist query
  try {
    browserslist(skuConfig.supportedBrowsers);
  } catch (e) {
    console.log(chalk.yellow(e.message));
    exitWithError(
      'Error: supportedBrowsers option is invalid, must be a valid browserslist query. More details: https://github.com/browserslist/browserslist'
    );
  }
};
