const chalk = require('chalk');

const prettierWrite = require('../lib/runPrettier').write;
const prettierConfig = require('../config/prettier/prettierConfig');

console.log(chalk.cyan('Formatting source code with Prettier'));

prettierWrite(prettierConfig)
  .then(() => {
    console.log(chalk.cyan('Prettier format complete'));
  })
  .catch(exitCode => {
    console.error('Error: Prettier exited with exit code', exitCode);
    process.exit(1);
  });
