import browserslist from 'browserslist';
import { closest } from 'fastest-levenshtein';
import { existsSync } from 'node:fs';

import configSchema from './configSchema.js';
import defaultSkuConfig from './defaultSkuConfig.js';
import defaultClientEntry from './defaultClientEntry.js';
import type { SkuConfig } from '../types/types.js';
import { hasErrorMessage } from '../utils/error-guards.js';
import type { ValidationError } from 'fastest-validator';
import { caution, critical, strong } from '@sku-private/utils/console';
import { getPathFromCwd } from '@sku-private/utils';

const availableConfigKeys = Object.keys(defaultSkuConfig);

const exitWithErrors = (errors: string[]) => {
  console.log(strong(critical('Errors in sku config:')));
  errors.forEach((e) => {
    console.log(caution(e));
  });
  process.exit(1);
};

export default (skuConfig: SkuConfig, appSkuConfig: SkuConfig = {}) => {
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

  if (skuConfig.buildType === 'ssr' && skuConfig.bundler !== 'vite') {
    errors.push(
      `🚫 '${strong(
        'buildType: ssr',
      )}' is only supported with the Vite bundler.`,
    );
  }

  if (
    skuConfig.buildType === 'ssr' &&
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

  // Check the consumer file (pre-defaults merge): defaults always include serverPort.
  if (
    skuConfig.buildType === 'ssr' &&
    skuConfig.bundler === 'vite' &&
    Object.prototype.hasOwnProperty.call(appSkuConfig, 'serverPort')
  ) {
    errors.push(
      `🚫 Vite SSR does not support '${strong(
        'serverPort',
      )}'. Use '${strong('port')}' for both \`sku start\` and the production default listen port (overridable via \`PORT\`).`,
    );
  }

  // Config always has a `public` path (default `'public'`); existence on disk is the signal.
  if (
    skuConfig.buildType === 'ssr' &&
    skuConfig.bundler === 'vite' &&
    skuConfig.public &&
    existsSync(getPathFromCwd(skuConfig.public))
  ) {
    errors.push(
      `🚫 Vite SSR does not support the '${strong(
        'public',
      )}' assets folder ('${strong(
        skuConfig.public,
      )}'). Import assets from modules instead so they go through the optimisation pipeline.`,
    );
  }

  // Check the consumer file (pre-defaults merge): defaults set dangerouslySetViteConfig to undefined.
  if (
    skuConfig.buildType === 'ssr' &&
    skuConfig.bundler === 'vite' &&
    Object.prototype.hasOwnProperty.call(
      appSkuConfig,
      'dangerouslySetViteConfig',
    )
  ) {
    errors.push(
      `🚫 Vite SSR does not support '${strong(
        'dangerouslySetViteConfig',
      )}'. Raise exceptional Vite customisation needs in #sku-support with your use-case.`,
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
