const chalk = require('chalk');
const runBin = require('./runBin');

const runPrettier = ({ write, listDifferent, config, filePattern }) => {
  const prettierConfig = config || {};

  let prettierArgs = [];

  if (prettierConfig.singleQuote) {
    prettierArgs.push('--single-quote');
  }
  if (write) {
    prettierArgs.push('--write');
  }
  if (listDifferent) {
    prettierArgs.push('--list-different');
  }

  prettierArgs = prettierArgs.concat(filePattern);

  /*
   * Show Prettier output with stdio: inherit
   * The child process will use the parent process's stdin/stdout/stderr
   * See https://nodejs.org/api/child_process.html#child_process_options_stdio
   */
  const processOptions = {
    stdio: 'inherit'
  };

  console.log(chalk.gray(`prettier ${prettierArgs.join(' ')}`));

  return runBin({
    packageName: 'prettier',
    args: prettierArgs,
    options: processOptions
  });
};

module.exports = {
  check: (filePattern, config) =>
    runPrettier({ listDifferent: true, config, filePattern }),
  write: (filePattern, config) =>
    runPrettier({ write: true, config, filePattern })
};
