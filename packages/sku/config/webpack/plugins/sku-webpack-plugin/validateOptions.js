import Validator from 'fastest-validator';
import browserslist from 'browserslist';
import chalk from 'chalk';
import didYouMean from 'didyoumean2';

const validator = new Validator();

const exitWithErrors = async (errors) => {
  console.log(
    chalk.bold(chalk.underline(chalk.red('SkuWebpackPlugin: Invalid options'))),
  );
  errors.forEach((error) => {
    console.log(chalk.yellow(error));
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

const validateOptions = (options) => {
  const errors = [];

  // Validate extra keys
  Object.keys(options)
    .filter((key) => !availableOptions.includes(key))
    .forEach((key) => {
      const unknownMessage = `Unknown option '${chalk.bold(key)}'.`;
      const suggestedKey = didYouMean(key, availableOptions);
      const suggestedMessage = suggestedKey
        ? ` Did you mean '${chalk.bold(suggestedKey)}'?`
        : '';
      errors.push(`❓ ${unknownMessage}${suggestedMessage}`);
    });

  // Validate schema types
  const schemaCheckResult = validate(options);
  if (schemaCheckResult !== true) {
    schemaCheckResult.forEach(({ message, field }) => {
      const errorMessage = message
        ? `🚫 ${message.replace(field, `${chalk.bold(field)}`)}`
        : `🚫 '${chalk.bold(field)}' is invalid`;

      errors.push(errorMessage);
    });
  }

  if (options.browserslist) {
    // Ensure 'browserslist' is valid browserslist query
    try {
      browserslist(options.browserslist);
    } catch (e) {
      errors.push(
        `🚫 '${chalk.bold(
          'browserslist',
        )}' must be a valid browserslist query. ${chalk.white(e.message)}`,
      );
    }
  }

  if (errors.length > 0) {
    exitWithErrors(errors);
  }
};

export default validateOptions;
