import browserslist from 'browserslist';
import chalk from 'chalk';
import didYouMean from 'didyoumean2';

import configSchema from './configSchema.js';
import defaultSkuConfig from './defaultSkuConfig.js';
import defaultClientEntry from './defaultClientEntry.js';
import type { SkuConfig } from '@/types/types.js';
import { hasErrorMessage } from '@/utils/error-guards.js';
import type { ValidationError } from 'fastest-validator';

const availableConfigKeys = Object.keys(defaultSkuConfig);

const exitWithErrors = async (errors: string[]) => {
  console.log(chalk.bold(chalk.underline(chalk.red('Errors in sku config:'))));
  errors.forEach((error) => {
    console.log(chalk.yellow(error));
  });
  process.exit(1);
};

export default (skuConfig: SkuConfig) => {
  const errors = [];

  // Validate extra keys
  Object.keys(skuConfig)
    .filter((key) => !availableConfigKeys.includes(key))
    .forEach((key) => {
      const unknownMessage = `Unknown key '${chalk.bold(key)}'.`;
      const suggestedKey = didYouMean(key, availableConfigKeys);
      const suggestedMessage = suggestedKey
        ? ` Did you mean '${chalk.bold(suggestedKey)}'?`
        : '';
      errors.push(`❓ ${unknownMessage}${suggestedMessage}`);
    });

  // Validate schema types
  if (!configSchema.async) {
    const schemaCheckResult = configSchema(skuConfig);
    if (schemaCheckResult !== true) {
      schemaCheckResult.forEach(({ message, field }: ValidationError) => {
        const errorMessage = message
          ? `🚫 ${message.replace(field, `${chalk.bold(field)}`)}`
          : `🚫 '${chalk.bold(field)}' is invalid`;

        errors.push(errorMessage);
      });
    }
  }

  // Validate library entry has corresponding libraryName
  if (skuConfig.libraryEntry && !skuConfig.libraryName) {
    errors.push(
      `🚫 '${chalk.bold('libraryEntry')}' must have a corresponding '${chalk.bold(
        'libraryName',
      )}' option. More details: ${chalk.underline(
        'https://github.com/seek-oss/sku#building-a-library',
      )}`,
    );
  }

  // Ensure defaultClientEntry is not configured as a route name
  skuConfig.routes?.forEach((skuRoute) => {
    if (typeof skuRoute !== 'string') {
      if (skuRoute.name === defaultClientEntry) {
        errors.push(
          `🚫 Invalid route name: '${chalk.bold(
            defaultClientEntry,
          )}', please use a different route name`,
        );
      }
    }
  });

  // Ensure supportedBrowsers is valid browserslist query
  try {
    browserslist(skuConfig.supportedBrowsers);
  } catch (e) {
    if (hasErrorMessage(e)) {
      errors.push(
        `🚫 '${chalk.bold(
          'supportedBrowsers',
        )}' must be a valid browserslist query. ${chalk.white(e.message)}`,
      );
    }
  }

  if (errors.length > 0) {
    exitWithErrors(errors);
  }
};
