import browserslist from 'browserslist';
import { yellow, red, bold, underline, white } from 'chalk';
import didYouMean from 'didyoumean2';

import configSchema from './configSchema.mjs';
import defaultSkuConfig from './defaultSkuConfig';
import defaultClientEntry from './defaultClientEntry';

const availableConfigKeys = Object.keys(defaultSkuConfig);

const exitWithErrors = async (errors) => {
  console.log(bold(underline(red('Errors in sku config:'))));
  errors.forEach((error) => {
    console.log(yellow(error));
  });
  process.exit(1);
};

export default (skuConfig) => {
  const errors = [];

  // Validate extra keys
  Object.keys(skuConfig)
    .filter((key) => !availableConfigKeys.includes(key))
    .forEach((key) => {
      const unknownMessage = `Unknown key '${bold(key)}'.`;
      const suggestedKey = didYouMean(key, availableConfigKeys);
      const suggestedMessage = suggestedKey
        ? ` Did you mean '${bold(suggestedKey)}'?`
        : '';
      errors.push(`❓ ${unknownMessage}${suggestedMessage}`);
    });

  // Validate schema types
  const schemaCheckResult = configSchema(skuConfig);
  if (schemaCheckResult !== true) {
    schemaCheckResult.forEach(({ message, field }) => {
      const errorMessage = message
        ? `🚫 ${message.replace(field, `${bold(field)}`)}`
        : `🚫 '${bold(field)}' is invalid`;

      errors.push(errorMessage);
    });
  }

  // Validate library entry has corresponding libraryName
  if (skuConfig.libraryEntry && !skuConfig.libraryName) {
    errors.push(
      `🚫 '${bold('libraryEntry')}' must have a corresponding '${bold(
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
        `🚫 Invalid route name: '${bold(
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
      `🚫 '${bold(
        'supportedBrowsers',
      )}' must be a valid browserslist query. ${white(e.message)}`,
    );
  }

  if (errors.length > 0) {
    exitWithErrors(errors);
  }
};
