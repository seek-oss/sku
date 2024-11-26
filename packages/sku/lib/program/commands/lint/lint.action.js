const chalk = require('chalk');
const esLintCheck = require('../../../runESLint').check;
const prettierCheck = require('../../../runPrettier').check;
const runTsc = require('../../../runTsc');

const { runVocabCompile } = require('../../../runVocab');
const { configureProject } = require('../../../utils/config-validators');

const lintAction = async (paths) => {
  await configureProject();
  const pathsToCheck = paths.length > 0 ? paths : undefined;

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
};

module.exports = lintAction;
