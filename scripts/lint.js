const chalk = require('chalk');
const baseESlintConfig = require('eslint-config-seek');
const EslintCLI = require('eslint').CLIEngine;

const isTypeScript = require('../lib/isTypeScript');
const prettierCheck = require('../lib/runPrettier').check;
const runTsc = require('../lib/runTsc');
const runTSLint = require('../lib/runTSLint');

const { paths, eslintDecorator } = require('../context');
const args = require('../config/args').argv;

(async () => {
  console.log(chalk.cyan('Linting'));

  if (isTypeScript()) {
    try {
      await runTsc();
      await runTSLint();
    } catch (e) {
      console.log(e);

      process.exit(1);
    }
  }

  const cli = new EslintCLI({
    baseConfig: eslintDecorator(baseESlintConfig),
    useEslintrc: false
  });

  const pathsToCheck = args.length === 0 ? paths.src : args;

  const formatter = cli.getFormatter();
  console.log(chalk.gray(`eslint ${pathsToCheck.join(' ')}`));
  const report = cli.executeOnFiles(pathsToCheck);

  console.log(formatter(report.results));

  if (report.errorCount > 0) {
    process.exit(1);
  }

  await prettierCheck();
})();
