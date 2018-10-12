const chalk = require('chalk');
const baseESlintConfig = require('eslint-config-seek');
const EslintCLI = require('eslint').CLIEngine;
const lodash = require('lodash');
const glob = require('glob-promise');

const builds = require('../config/builds');
const prettierCheck = require('../lib/runPrettier').check;
const prettierConfig = require('../config/prettier/prettierConfig');
const runTsc = require('../lib/runTsc');

const args = require('../config/args').argv;

const run = async () => {
  console.log(chalk.cyan('Linting'));

  const hasTSFiles = await glob('**/*.{ts,tsx}').then(
    files => files.length > 0
  );

  if (hasTSFiles) {
    try {
      await runTsc();
    } catch (e) {
      console.log(e);

      process.exit(1);
    }
  }

  // Decorate eslint config is not supported for monorepo
  const eslintConfig =
    builds.length === 1
      ? builds[0].eslintDecorator(baseESlintConfig)
      : baseESlintConfig;

  // should be moved to eslint-config-seek ??????
  const typescriptEslintConfig = {
    parserOptions: {
      ecmaFeatures: { jsx: true }
    },
    settings: {
      'import/parsers': {
        'typescript-eslint-parser': ['.ts', '.tsx']
      },
      'import/resolver': {
        node: {
          extensions: ['.js', '.ts', '.tsx']
        }
      }
    }
  };
  const cli = new EslintCLI({
    baseConfig: lodash.merge(eslintConfig, typescriptEslintConfig),
    useEslintrc: false
  });

  const pathsToCheck = args.length === 0 ? builds[0].paths.src : args;

  const formatter = cli.getFormatter();
  console.log(chalk.gray(`eslint ${pathsToCheck.join(' ')}`));
  const report = cli.executeOnFiles(pathsToCheck);

  console.log(formatter(report.results));

  if (report.errorCount > 0) {
    process.exit(1);
  }

  console.log(chalk.cyan('Checking Prettier format rules'));

  const filePattern =
    args.length === 0
      ? builds[0].paths.src.map(srcPath => `${srcPath}/**/*.js`)
      : args;

  prettierCheck(filePattern, prettierConfig)
    .then(() => {
      console.log(chalk.cyan('Prettier format rules passed'));
    })
    .catch(exitCode => {
      console.error(
        'Error: The file(s) listed above failed the prettier check'
      );
      console.error('Error: Prettier check exited with exit code', exitCode);
      process.exit(1);
    });
};

run();
