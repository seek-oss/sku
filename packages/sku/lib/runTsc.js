const chalk = require('chalk');
const { runBin } = require('./runBin');
const { cwd } = require('./cwd');

module.exports = () => {
  console.log(chalk.cyan(`Checking code with TypeScript compiler`));
  console.log(chalk.gray(`Path: ${cwd()}`));

  return runBin({
    packageName: 'typescript',
    binName: 'tsc',
    args: ['--project', cwd(), '--noEmit'],
    options: { stdio: 'inherit' },
  });
};
