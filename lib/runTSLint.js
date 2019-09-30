const chalk = require('chalk');
const { runBin } = require('./runBin');
const { cwd } = require('./cwd');

module.exports = pathsToCheck => {
  const checkAll = typeof pathsToCheck === 'undefined';

  console.log(chalk.cyan(`Checking code with TSLint`));
  const filterTSOnly = checkAll
    ? []
    : pathsToCheck.filter(
        filePath => filePath.endsWith('.ts') || filePath.endsWith('.tsx'),
      );

  if (!checkAll && filterTSOnly.length === 0) {
    console.log(chalk.gray(`No TS files to lint`));
  } else {
    console.log(
      chalk.gray(`Paths: ${filterTSOnly.length > 0 ? filterTSOnly : cwd()}`),
    );

    return runBin({
      packageName: 'tslint',
      args: ['--project', cwd(), ...filterTSOnly],
      options: { stdio: 'inherit' },
    });
  }

  return true;
};
