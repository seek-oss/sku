const chalk = require('chalk');
const baseESlintConfig = require('eslint-config-seek');
const EslintCLI = require('eslint').CLIEngine;

const isTypeScript = require('../lib/isTypeScript');
const prettierCheck = require('../lib/runPrettier').check;
const runTsc = require('../lib/runTsc');
const runTSLint = require('../lib/runTSLint');

const { paths, eslintDecorator } = require('../config/projectConfig');
const args = require('../config/args').argv;

(async () => {
  console.log(chalk.cyan('Linting'));

  const eslint = new EslintCLI({
    baseConfig: eslintDecorator(baseESlintConfig),
    useEslintrc: false
  });

  const pathsToCheck = eslint.resolveFileGlobPatterns(
    args.length === 0 ? paths.src : args
  );

  if (isTypeScript()) {
    try {
      await runTsc();
      await runTSLint(pathsToCheck);
    } catch (e) {
      console.log(e);

      process.exit(1);
    }
  }

  const formatter = eslint.getFormatter();
  console.log(chalk.gray(`eslint ${pathsToCheck.join(' ')}`));
  const report = eslint.executeOnFiles(pathsToCheck);

  console.log(formatter(report.results));

  if (report.errorCount > 0) {
    process.exit(1);
  }

  await prettierCheck(pathsToCheck);
})();
