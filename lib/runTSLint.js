const chalk = require('chalk');
const { runBin } = require('./runBin');
const { cwd } = require('./cwd');

module.exports = (pathsToCheck = []) => {
  console.log(chalk.cyan(`Checking code with TSLint`));
  const filterTSOnly = pathsToCheck.filter(
    filePath => filePath.endsWith('.ts') || filePath.endsWith('.tsx'),
  );

  if (filterTSOnly.length === 0) {
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
