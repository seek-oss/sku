const chalk = require('chalk');
const isTypeScript = require('../lib/isTypeScript');
const esLintCheck = require('../lib/runESLint').check;
const prettierCheck = require('../lib/runPrettier').check;
const runTsc = require('../lib/runTsc');
const runTSLint = require('../lib/runTSLint');
const args = require('../config/args').argv;
const pathsToCheck = args.length > 0 ? args : undefined;

(async () => {
  console.log(chalk.cyan('Linting'));

  try {
    if (isTypeScript) {
      await runTsc();
      await runTSLint(pathsToCheck);
    }

    await prettierCheck(pathsToCheck);
    await esLintCheck(pathsToCheck);
  } catch (e) {
    if (e) {
      console.error(e);
    }

    process.exit(1);
  }

  console.log(chalk.cyan('Linting complete'));
})();
