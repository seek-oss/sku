import Validator from 'fastest-validator';
import browserslist from 'browserslist';
import { closest } from 'fastest-levenshtein';
import { hasErrorMessage } from '../../../../utils/error-guards.js';
import { caution, critical, strong } from '@sku-private/utils/console';

// @ts-expect-error
const validator = new Validator();

const exitWithErrors = async (errors: string[]) => {
  console.log(strong(critical('SkuWebpackPlugin: Invalid options')));
  errors.forEach((error) => {
    console.log(caution(error));
  });
  process.exit(1);
};

export type SkuWebpackPluginOptions = {
  target: 'node' | 'browser';
  MiniCssExtractPlugin: any;
  mode?: 'development' | 'production';
  hot?: boolean;
  include?: string[];
  compilePackages?: string[];
  libraryName?: string;
  generateCSSTypes?: boolean;
  removeAssertionsInProduction?: boolean;
  browserslist?: string[];
  displayNamesProd?: boolean;
  rootResolution?: boolean;
};

const schema = {
  target: {
    type: 'enum',
    values: ['node', 'browser'],
  },
  MiniCssExtractPlugin: {
    type: 'any',
  },
  mode: {
    type: 'enum',
    values: ['development', 'production'],
    optional: true,
  },
  hot: {
    type: 'boolean',
    optional: true,
  },
  include: {
    type: 'array',
    items: 'string',
    optional: true,
  },
  compilePackages: {
    type: 'array',
    items: 'string',
    optional: true,
  },
  libraryName: {
    type: 'string',
    optional: true,
  },
  generateCSSTypes: {
    type: 'boolean',
    optional: true,
  },
  removeAssertionsInProduction: {
    type: 'boolean',
    optional: true,
  },
  browserslist: {
    type: 'array',
    items: 'string',
    optional: true,
  },
  displayNamesProd: {
    type: 'boolean',
    optional: true,
  },
  rootResolution: {
    type: 'boolean',
    optional: true,
  },
};

const validate = validator.compile(schema);

const availableOptions = Object.keys(schema);

export const validateOptions = (options: SkuWebpackPluginOptions) => {
  const errors = [];

  // Validate extra keys
  Object.keys(options)
    .filter((key) => !availableOptions.includes(key))
    .forEach((key) => {
      const unknownMessage = `Unknown option '${strong(key)}'.`;
      const suggestedKey = closest(key, availableOptions);
      const suggestedMessage = suggestedKey
        ? ` Did you mean '${strong(suggestedKey)}'?`
        : '';
      errors.push(`❓ ${unknownMessage}${suggestedMessage}`);
    });

  // Validate schema types
  const schemaCheckResult = validate(options);
  if (schemaCheckResult !== true) {
    schemaCheckResult.forEach(
      ({ message, field }: { message: string; field: string }) => {
        const errorMessage = message
          ? `🚫 ${message.replace(field, `${strong(field)}`)}`
          : `🚫 '${strong(field)}' is invalid`;

        errors.push(errorMessage);
      },
    );
  }

  if (options.browserslist) {
    // Ensure 'browserslist' is valid browserslist query
    try {
      browserslist(options.browserslist);
    } catch (e) {
      if (hasErrorMessage(e)) {
        errors.push(
          `🚫 '${strong(
            'browserslist',
          )}' must be a valid browserslist query. ${strong(e.message)}`,
        );
      }
    }
  }

  if (errors.length > 0) {
    exitWithErrors(errors);
  }
};
