const chalk = require('chalk');

const prettierWrite = require('../lib/runPrettier').write;
const prettierConfig = require('../config/prettier/prettierConfig');

const args = process.argv.slice(2);

console.log(chalk.cyan('Formatting source code with Prettier'));

const defaultFilePattern = 'src/**/*.js';
const filePattern = args.length === 0 ? defaultFilePattern : args;

prettierWrite(filePattern, prettierConfig)
  .then(() => {
    console.log(chalk.cyan('Prettier format complete'));
  })
  .catch(exitCode => {
    console.error('Error: Prettier exited with exit code', exitCode);
    process.exit(1);
  });
