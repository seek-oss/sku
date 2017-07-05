const { spawn } = require('child_process');
const path = require('path');

const cwd = process.cwd();

const filePattern = 'src/**/*.js';

function runPrettier({ write, listDifferent, config }) {
  const prettierConfig = config || {};

  const prettierPath = path.join(
    require.resolve('prettier'),
    '../bin/prettier.js'
  );

  const prettierArgs = [filePattern];

  if (prettierConfig.singleQuote) {
    prettierArgs.push('--single-quote');
  }
  if (write) {
    prettierArgs.push('--write');
  }
  if (listDifferent) {
    prettierArgs.push('--list-different');
  }

  /*
   * Show Prettier output with stdio: inherit
   * The child process will use the parent process's stdin/stdout/stderr
   * See https://nodejs.org/api/child_process.html#child_process_options_stdio
   */
  const processOptions = {
    stdio: 'inherit'
  };

  const prettierProcess = spawn(prettierPath, prettierArgs, processOptions);

  return new Promise((resolve, reject) => {
    prettierProcess.on('exit', exitCode => {
      if (exitCode === 0) {
        resolve(exitCode);
        return;
      }
      reject(exitCode);
    });
  });
}

function write(config) {
  return runPrettier({ write: true, config });
}

function check(config) {
  return runPrettier({ listDifferent: true, config });
}

module.exports = {
  check,
  write
};
