import browserslist from 'browserslist';
import { closest } from 'fastest-levenshtein';
import { existsSync } from 'node:fs';

import configSchema from './configSchema.js';
import defaultSkuConfig from './defaultSkuConfig.js';
import defaultClientEntry from './defaultClientEntry.js';
import type { SkuConfig } from '../types/types.js';
import { hasErrorMessage } from '../utils/error-guards.js';
import {
  cspExtraSourceDirectives,
  isCspExtraSourceDirective,
} from '../utils/csp.js';
import type { ValidationError } from 'fastest-validator';
import { caution, critical, strong } from '@sku-private/utils/console';
import { getPathFromCwd } from '@sku-private/utils';

const availableConfigKeys = Object.keys(defaultSkuConfig);

const reservedEnvironmentNames = ['client', 'rendered', 'server'];

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

  if (skuConfig.distSubfolders && skuConfig.buildType === 'ssr') {
    errors.push(
      `🚫 '${strong('distSubfolders')}' is not supported with '${strong(
        'buildType: ssr',
      )}'. SSR output is always split into 'client' and 'server'.`,
    );
  }

  for (const reservedName of reservedEnvironmentNames) {
    if (skuConfig.environments?.includes(reservedName)) {
      errors.push(
        `🚫 '${strong(
          reservedName,
        )}' is reserved and cannot be used as an environment name.`,
      );
    }
  }

  if (
    skuConfig.buildType === 'ssr' &&
    skuConfig.bundler === 'vite' &&
    skuConfig.publicPath &&
    (/^https?:\/\//i.test(skuConfig.publicPath) ||
      skuConfig.publicPath.startsWith('//'))
  ) {
    errors.push(
      `🚫 SSR requires a relative '${strong(
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
      `🚫 SSR does not support '${strong(
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
      `🚫 SSR does not support the '${strong(
        'public',
      )}' assets folder ('${strong(
        skuConfig.public,
      )}'). Import assets from modules instead so they go through the optimisation pipeline.`,
    );
  }

  // Check the consumer file (pre-defaults merge): defaults set dangerouslySetViteConfig to undefined
  // and vitePlugins to [].
  if (
    skuConfig.buildType === 'ssr' &&
    skuConfig.bundler === 'vite' &&
    Object.prototype.hasOwnProperty.call(
      appSkuConfig,
      'dangerouslySetViteConfig',
    )
  ) {
    errors.push(
      `🚫 SSR does not support '${strong(
        'dangerouslySetViteConfig',
      )}'. Raise exceptional Vite customisation needs in #sku-support with your use-case.`,
    );
  }

  if (
    skuConfig.buildType === 'ssr' &&
    skuConfig.bundler === 'vite' &&
    Object.prototype.hasOwnProperty.call(appSkuConfig, 'vitePlugins')
  ) {
    errors.push(
      `🚫 SSR does not support '${strong(
        'vitePlugins',
      )}'. Raise exceptional Vite customisation needs in #sku-support with your use-case.`,
    );
  }

  const cspOptionReplacements = [
    ['cspExtraScriptSrcHosts', 'cspExtraSources'],
    ['cspReportOnlyExtraScriptSrcHosts', 'cspReportOnlyExtraSources'],
  ] as const;

  // Check the consumer file (pre-defaults merge): defaults set both host options and extra sources.
  for (const [hostsOption, sourcesOption] of cspOptionReplacements) {
    if (
      skuConfig.buildType === 'ssr' &&
      Object.prototype.hasOwnProperty.call(appSkuConfig, hostsOption)
    ) {
      errors.push(
        `🚫 SSR does not support '${strong(hostsOption)}'. Use '${strong(
          `${sourcesOption}['script-src']`,
        )}' instead.`,
      );
    }

    if (
      skuConfig.buildType !== 'ssr' &&
      Object.prototype.hasOwnProperty.call(appSkuConfig, sourcesOption)
    ) {
      errors.push(
        `🚫 '${strong(sourcesOption)}' is only supported with '${strong(
          'buildType: ssr',
        )}'. Use '${strong(hostsOption)}' instead.`,
      );
    }

    const extraSources = (skuConfig as Record<string, unknown>)[sourcesOption];
    if (typeof extraSources === 'object' && extraSources !== null) {
      for (const [directive, sources] of Object.entries(extraSources)) {
        const field = `${sourcesOption}['${directive}']`;

        if (!isCspExtraSourceDirective(directive)) {
          errors.push(
            `🚫 '${strong(field)}' is not a supported directive. Supported directives: ${cspExtraSourceDirectives.join(', ')}.`,
          );
        }

        if (!Array.isArray(sources)) {
          continue;
        }

        for (const source of sources) {
          if (typeof source !== 'string') {
            continue;
          }

          if (source.includes("'")) {
            errors.push(
              `🚫 '${strong(field)}' contains ${strong(
                source,
              )}. Quoted sources (keywords, nonces and hashes) are not supported.`,
            );
          } else if (source === '*') {
            errors.push(
              `🚫 '${strong(field)}' contains a bare ${strong(
                '*',
              )}, which allows any origin. List specific origins instead.`,
            );
          } else if (/[\s;,]/.test(source)) {
            errors.push(
              `🚫 '${strong(field)}' contains ${strong(
                source,
              )}. Each source must be a single value without whitespace, ';' or ','.`,
            );
          }
        }
      }
    }
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
