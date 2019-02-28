const chalk = require('chalk');
const EslintCLI = require('eslint').CLIEngine;
const eslintConfig = require('../config/eslint/eslintConfig');
const isTypeScript = require('../lib/isTypeScript');
const prettierCheck = require('../lib/runPrettier').check;
const runTsc = require('../lib/runTsc');
const runTSLint = require('../lib/runTSLint');
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
    baseConfig: eslintConfig,
    useEslintrc: false,
  });

  const pathsToCheck = args.length === 0 ? ['.'] : args;

  const formatter = cli.getFormatter();
  console.log(chalk.gray(`eslint ${pathsToCheck.join(' ')}`));
  const report = cli.executeOnFiles(pathsToCheck);

  console.log(formatter(report.results));

  if (report.errorCount > 0) {
    process.exit(1);
  }

  await prettierCheck();
})();
