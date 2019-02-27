const browserslist = require('browserslist');
const { yellow, red, bold, underline, white } = require('chalk');
const didYouMean = require('didyoumean2').default;
const { emojify } = require('node-emoji');

const configSchema = require('./configSchema');
const defaultSkuConfig = require('./defaultSkuConfig');
const defaultClientEntry = require('./defaultClientEntry');

const availableConfigKeys = Object.keys(defaultSkuConfig);

const exitWithErrors = errors => {
  console.log(bold(underline(red('Errors in sku config:'))));
  errors.forEach(error => {
    console.log(yellow(emojify(error)));
  });
  process.exit(1);
};

module.exports = skuConfig => {
  const errors = [];

  // Validate extra keys
  Object.keys(skuConfig)
    .filter(key => !availableConfigKeys.includes(key))
    .forEach(key => {
      const unknownMessage = `Unknown key '${bold(key)}'.`;
      const suggestedKey = didYouMean(key, availableConfigKeys);
      const suggestedMessage = suggestedKey
        ? ` Did you mean '${bold(suggestedKey)}'?`
        : '';
      errors.push(`:question: ${unknownMessage}${suggestedMessage}`);
    });

  // Validate schema types
  const schemaCheckResult = configSchema(skuConfig);
  if (schemaCheckResult !== true) {
    schemaCheckResult.forEach(({ message, field }) => {
      const errorMessage = message
        ? `:no_entry_sign: ${message.replace(field, `${bold(field)}`)}`
        : `:no_entry_sign: '${bold(field)}' is invalid`;

      errors.push(errorMessage);
    });
  }

  // Validate library entry has corresponding libraryName
  if (skuConfig.libraryEntry && !skuConfig.libraryName) {
    errors.push(
      `:no_entry_sign: '${bold(
        'libraryEntry',
      )}' must have a corresponding '${bold(
        'libraryName',
      )}' option. More details: ${underline(
        'https://github.com/seek-oss/sku#building-a-library',
      )}`,
    );
  }

  // Ensure defaultClientEntry is not configured as a route name
  skuConfig.routes.forEach(({ name }) => {
    if (name === defaultClientEntry) {
      errors.push(
        `:no_entry_sign: Invalid route name: '${bold(
          defaultClientEntry,
        )}', please use a different route name`,
      );
    }
  });

  // Ensure supportedBrowsers is valid browserslist query
  try {
    browserslist(skuConfig.supportedBrowsers);
  } catch (e) {
    errors.push(
      `:no_entry_sign: '${bold(
        'supportedBrowsers',
      )}' must be a valid browserslist query. ${white(e.message)}`,
    );
  }

  if (errors.length > 0) {
    exitWithErrors(errors);
  }
};
