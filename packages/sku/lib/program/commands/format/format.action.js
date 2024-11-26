const chalk = require('chalk');
const { configureProject } = require('../../../utils/config-validators');
const esLintFix = require('../../../runESLint').fix;
const prettierWrite = require('../../../runPrettier').write;

const formatAction = async (paths) => {
  await configureProject();
  const pathsToCheck = paths.length > 0 ? paths : undefined;

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
};

module.exports = formatAction;
