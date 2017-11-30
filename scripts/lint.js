const chalk = require('chalk');
const baseESlintConfig = require('eslint-config-sku');
const EslintCLI = require('eslint').CLIEngine;
const builds = require('../config/builds');

const prettierCheck = require('../lib/runPrettier').check;
const prettierConfig = require('../config/prettier/prettierConfig');

const args = process.argv.slice(2);

// Decorate eslint config is not supported for monorepo
const eslintConfig =
  builds.length === 1
    ? builds[0].eslintDecorator(baseESlintConfig)
    : baseESlintConfig;

const cli = new EslintCLI({
  baseConfig: eslintConfig,
  useEslintrc: false
});

const pathsToCheck = args.length === 0 ? ['src'] : args;

const formatter = cli.getFormatter();
const report = cli.executeOnFiles(pathsToCheck);

console.log(chalk.cyan('Linting'));
console.log(formatter(report.results));

if (report.errorCount > 0) {
  process.exit(1);
}

console.log(chalk.cyan('Checking Prettier format rules'));

const defaultFilePattern = 'src/**/*.js';
const filePattern = args.length === 0 ? defaultFilePattern : args;

prettierCheck(filePattern, prettierConfig)
  .then(() => {
    console.log(chalk.cyan('Prettier format rules passed'));
  })
  .catch(exitCode => {
    console.error('Error: The file(s) listed above failed the prettier check');
    console.error('Error: Prettier check exited with exit code', exitCode);
    process.exit(1);
  });
