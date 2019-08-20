const chalk = require('chalk');
const esLintFix = require('../lib/runESLint').fix;
const prettierWrite = require('../lib/runPrettier').write;
const args = require('../config/args').argv;
const pathsToCheck = args.length > 0 ? args : undefined;

(async () => {
  console.log(chalk.cyan('Formatting'));

  try {
    await esLintFix(pathsToCheck);
    await prettierWrite(pathsToCheck);
  } catch (e) {
    if (e) {
      console.error(e);
    }

    process.exit(1);
  }
  console.log(chalk.cyan('Formatting complete'));
})();
