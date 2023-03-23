const chalk = require('chalk');
const esLintCheck = require('../lib/runESLint').check;
const prettierCheck = require('../lib/runPrettier').check;
const runTsc = require('../lib/runTsc');
const args = require('../config/args').argv;
const pathsToCheck = args.length > 0 ? args : undefined;

const { runVocabCompile } = require('../lib/runVocab');

(async () => {
  console.log(chalk.cyan('Linting'));

  await runVocabCompile();

  try {
    const hasPaths = typeof pathsToCheck !== 'undefined';
    const pathsIncludeTS =
      hasPaths &&
      pathsToCheck.filter(
        (filePath) => filePath.endsWith('.ts') || filePath.endsWith('.tsx'),
      ).length > 0;

    if (!hasPaths || pathsIncludeTS) {
      await runTsc();
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
