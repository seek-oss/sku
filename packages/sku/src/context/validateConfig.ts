import browserslist from 'browserslist';
import { closest } from 'fastest-levenshtein';

import configSchema from './configSchema.js';
import defaultSkuConfig from './defaultSkuConfig.js';
import defaultClientEntry from './defaultClientEntry.js';
import type { SkuConfig } from '../types/types.js';
import { hasErrorMessage } from '../utils/error-guards.js';
import type { ValidationError } from 'fastest-validator';
import { caution, critical, strong } from '@sku-private/utils/console';

const availableConfigKeys = Object.keys(defaultSkuConfig);

const exitWithErrors = async (errors: string[]) => {
  console.log(strong(critical('Errors in sku config:')));
  errors.forEach((e) => {
    console.log(caution(e));
  });
  process.exit(1);
};

export default (skuConfig: SkuConfig) => {
  const errors = [];

  // Validate extra keys
  Object.keys(skuConfig)
    .filter((key) => !availableConfigKeys.includes(key))
    .forEach((key) => {
      const unknownMessage = `Unknown key '${strong(key)}'.`;
      const suggestedKey = closest(key, availableConfigKeys);
      const suggestedMessage = suggestedKey
        ? ` Did you mean '${strong(suggestedKey)}'?`
        : '';
      errors.push(`❓ ${unknownMessage}${suggestedMessage}`);
    });

  // Validate schema types
  if (!configSchema.async) {
    const schemaCheckResult = configSchema(skuConfig);
    if (schemaCheckResult !== true) {
      schemaCheckResult.forEach(({ message, field }: ValidationError) => {
        const errorMessage = message
          ? `🚫 ${message.replace(field, `${strong(field)}`)}`
          : `🚫 '${strong(field)}' is invalid`;

        errors.push(errorMessage);
      });
    }
  }

  // Validate library entry has corresponding libraryName
  if (skuConfig.libraryEntry && !skuConfig.libraryName) {
    errors.push(
      `🚫 '${strong('libraryEntry')}' must have a corresponding '${strong(
        'libraryName',
      )}' option. More details: ${strong(
        'https://github.com/seek-oss/sku#building-a-library',
      )}`,
    );
  }

  if (
    skuConfig.renderType === 'server-side-rendered' &&
    skuConfig.bundler !== 'vite'
  ) {
    errors.push(
      `🚫 '${strong(
        'renderType: server-side-rendered',
      )}' is only supported with the Vite bundler.`,
    );
  }

  if (
    skuConfig.renderType === 'server-side-rendered' &&
    skuConfig.bundler === 'vite' &&
    skuConfig.publicPath &&
    (/^https?:\/\//i.test(skuConfig.publicPath) ||
      skuConfig.publicPath.startsWith('//'))
  ) {
    errors.push(
      `🚫 Vite SSR requires a relative '${strong(
        'publicPath',
      )}' (e.g. '/' or '/static/'). Absolute http(s) / CDN publicPath is not supported.`,
    );
  }

  // Ensure defaultClientEntry is not configured as a route name
  skuConfig.routes?.forEach((skuRoute) => {
    if (typeof skuRoute !== 'string') {
      if (skuRoute.name === defaultClientEntry) {
        errors.push(
          `🚫 Invalid route name: '${strong(
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
        `🚫 '${strong(
          'supportedBrowsers',
        )}' must be a valid browserslist query. ${strong(e.message)}`,
      );
    }
  }

  if (errors.length > 0) {
    exitWithErrors(errors);
  }
};
