const Validator = require('fastest-validator');
const browserslist = require('browserslist');
const { yellow, red, bold, underline, white } = require('chalk');
const didYouMean = require('didyoumean2').default;
const { emojify } = require('node-emoji');

const validator = new Validator();

const exitWithErrors = (errors) => {
  console.log(bold(underline(red('SkuWebpackPlugin: Invalid options'))));
  errors.forEach((error) => {
    console.log(yellow(emojify(error)));
  });
  process.exit(1);
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
  supportedBrowsers: {
    type: 'array',
    items: 'string',
    optional: true,
  },
  displayNamesProd: {
    type: 'boolean',
    optional: true,
  },
};

const validate = validator.compile(schema);

const availableOptions = Object.keys(schema);

module.exports = (options) => {
  const errors = [];

  // Validate extra keys
  Object.keys(options)
    .filter((key) => !availableOptions.includes(key))
    .forEach((key) => {
      const unknownMessage = `Unknown option '${bold(key)}'.`;
      const suggestedKey = didYouMean(key, availableOptions);
      const suggestedMessage = suggestedKey
        ? ` Did you mean '${bold(suggestedKey)}'?`
        : '';
      errors.push(`:question: ${unknownMessage}${suggestedMessage}`);
    });

  // Validate schema types
  const schemaCheckResult = validate(options);
  if (schemaCheckResult !== true) {
    schemaCheckResult.forEach(({ message, field }) => {
      const errorMessage = message
        ? `:no_entry_sign: ${message.replace(field, `${bold(field)}`)}`
        : `:no_entry_sign: '${bold(field)}' is invalid`;

      errors.push(errorMessage);
    });
  }

  if (options.supportedBrowsers) {
    // Ensure supportedBrowsers is valid browserslist query
    try {
      browserslist(options.supportedBrowsers);
    } catch (e) {
      errors.push(
        `:no_entry_sign: '${bold(
          'supportedBrowsers',
        )}' must be a valid browserslist query. ${white(e.message)}`,
      );
    }
  }

  if (errors.length > 0) {
    exitWithErrors(errors);
  }
};
