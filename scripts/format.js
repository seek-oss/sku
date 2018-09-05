const path = require('path');
const chalk = require('chalk');

const prettierWrite = require('../lib/runPrettier').write;
const prettierConfig = require('../config/prettier/prettierConfig');

const defaultPath = require('../config/prettier/defaultPath');
const builds = require('../config/builds');

const args = process.argv.slice(2);

console.log(chalk.cyan('Formatting source code with Prettier'));

const filePattern =
  args.length === 0
    ? builds[0].paths.src.map(
        srcPath => `${path.relative(process.cwd(), srcPath)}/**/*.js`
      )
    : args;

prettierWrite(filePattern, prettierConfig)
  .then(() => {
    console.log(chalk.cyan('Prettier format complete'));
  })
  .catch(exitCode => {
    console.error('Error: Prettier exited with exit code', exitCode);
    process.exit(1);
  });
