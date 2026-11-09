import browserslist from 'browserslist';
import { closest } from 'fastest-levenshtein';
import { existsSync } from 'node:fs';

import configSchema from './configSchema.js';
import defaultSkuConfig from './defaultSkuConfig.js';
import defaultClientEntry from './defaultClientEntry.js';
import type { SkuConfig } from '../types/types.js';
import { hasErrorMessage } from '../utils/error-guards.js';
import {
  cspEndpointNames,
  cspExtraSourceDirectives,
  cspPolicyNames,
  isCspExtraSourceDirective,
} from '../utils/csp.js';
import type { ValidationError } from 'fastest-validator';
import { caution, critical, strong } from '@sku-private/utils/console';
import { getPathFromCwd } from '@sku-private/utils';

const availableConfigKeys = Object.keys(defaultSkuConfig);

const reservedEnvironmentNames = ['client', 'rendered', 'server'];

// `null` means there is no replacement, because SSR always delivers CSP as headers.
const flatCspOptionReplacements: Record<string, string | null> = {
  cspEnabled: 'csp.enforced',
  cspExtraScriptSrcHosts: "csp.enforced.extraSources['script-src']",
  cspReportTo: 'csp.enforced.reportTo',
  cspReportOnlyEnabled: 'csp.reportOnly',
  cspReportOnlyExtraScriptSrcHosts: "csp.reportOnly.extraSources['script-src']",
  cspReportOnlyReportTo: 'csp.reportOnly.reportTo',
  cspDelivery: null,
};

const isHttpUrl = (value: unknown) =>
  typeof value === 'string' &&
  URL.canParse(value) &&
  ['http:', 'https:'].includes(new URL(value).protocol);

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

  // Check the consumer file (pre-defaults merge): defaults set every flat CSP option.
  if (skuConfig.buildType === 'ssr') {
    for (const [option, replacement] of Object.entries(
      flatCspOptionReplacements,
    )) {
      if (Object.prototype.hasOwnProperty.call(appSkuConfig, option)) {
        errors.push(
          replacement
            ? `🚫 SSR does not support '${strong(option)}'. Use '${strong(
                replacement,
              )}' instead.`
            : `🚫 SSR does not support '${strong(
                option,
              )}'. SSR always delivers CSP as HTTP headers, so remove it.`,
        );
      }
    }
  } else if (Object.prototype.hasOwnProperty.call(appSkuConfig, 'csp')) {
    errors.push(
      `🚫 '${strong('csp')}' is only supported with '${strong(
        'buildType: ssr',
      )}'. Use the flat '${strong('csp*')}' options instead, such as '${strong(
        'cspEnabled',
      )}'.`,
    );
  }

  const csp = (skuConfig as Record<string, unknown>).csp;
  const cspPolicies =
    typeof csp === 'object' && csp !== null
      ? (csp as Record<string, unknown>)
      : {};

  for (const key of Object.keys(cspPolicies)) {
    if (!(cspPolicyNames as readonly string[]).includes(key)) {
      errors.push(
        `🚫 '${strong(`csp.${key}`)}' is not supported. Use '${strong(
          'csp.enforced',
        )}' or '${strong('csp.reportOnly')}'.`,
      );
    }
  }

  for (const policyName of cspPolicyNames) {
    const policy = cspPolicies[policyName];
    const policyField = `csp.${policyName}`;

    if (policy === undefined || policy === true) {
      continue;
    }

    if (
      typeof policy !== 'object' ||
      policy === null ||
      Array.isArray(policy)
    ) {
      errors.push(
        `🚫 '${strong(policyField)}' must be ${strong(
          'true',
        )} or an object with '${strong('extraSources')}' and '${strong(
          'reportTo',
        )}'.`,
      );
      continue;
    }

    const { extraSources, reportTo, ...unknownKeys } = policy as Record<
      string,
      unknown
    >;

    for (const key of Object.keys(unknownKeys)) {
      errors.push(
        `🚫 '${strong(`${policyField}.${key}`)}' is not supported. Use '${strong(
          'extraSources',
        )}' or '${strong('reportTo')}'.`,
      );
    }

    if (reportTo !== undefined && !isHttpUrl(reportTo)) {
      errors.push(
        `🚫 '${strong(
          `${policyField}.reportTo`,
        )}' must be an absolute http: or https: URL. sku names the endpoint '${strong(
          cspEndpointNames[policyName],
        )}'.`,
      );
    }

    if (extraSources === undefined) {
      continue;
    }

    if (
      typeof extraSources !== 'object' ||
      extraSources === null ||
      Array.isArray(extraSources)
    ) {
      errors.push(
        `🚫 '${strong(
          `${policyField}.extraSources`,
        )}' must be an object keyed by directive name.`,
      );
      continue;
    }

    for (const [directive, sources] of Object.entries(extraSources)) {
      const field = `${policyField}.extraSources['${directive}']`;

      if (!isCspExtraSourceDirective(directive)) {
        errors.push(
          `🚫 '${strong(field)}' is not a supported directive. Supported directives: ${cspExtraSourceDirectives.join(', ')}.`,
        );
      }

      if (
        !Array.isArray(sources) ||
        sources.some((source) => typeof source !== 'string')
      ) {
        errors.push(`🚫 '${strong(field)}' must be an array of strings.`);
        continue;
      }

      for (const source of sources as string[]) {
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
        } else if (
          directive === 'script-src' &&
          /^[a-z][a-z0-9+.-]*:$/i.test(source)
        ) {
          errors.push(
            `🚫 '${strong(field)}' contains the scheme ${strong(
              source,
            )}, which allows scripts from any origin using it. List specific origins instead.`,
          );
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
