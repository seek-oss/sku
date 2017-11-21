const chalk = require('chalk');
const baseConfig = require('eslint-config-sku');
const EslintCLI = require('eslint').CLIEngine;
const builds = require('../config/builds');

const prettierCheck = require('../lib/runPrettier').check;
const prettierConfig = require('../config/prettier/prettierConfig');

// Decorate eslint config is not supported for monorepo
const eslintConfig =
  builds.length === 1 ? builds[0].eslintDecorator(baseConfig) : baseConfig;

const cli = new EslintCLI({
  baseConfig: eslintConfig,
  useEslintrc: false
});

const formatter = cli.getFormatter();
const report = cli.executeOnFiles(['src']);

console.log(chalk.cyan('Linting'));
console.log(formatter(report.results));

if (report.errorCount > 0) {
  process.exit(1);
}

console.log(chalk.cyan('Checking Prettier format rules'));
prettierCheck(prettierConfig)
  .then(() => {
    console.log(chalk.cyan('Prettier format rules passed'));
  })
  .catch(exitCode => {
    console.error('Error: The file(s) listed above failed the prettier check');
    console.error('Error: Prettier check exited with exit code', exitCode);
    process.exit(1);
  });
