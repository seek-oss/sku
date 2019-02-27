const fs = require('fs');
const path = require('path');
const { promisify } = require('util');
const chalk = require('chalk');
const { runBin } = require('./runBin');
const { getPathFromCwd } = require('./cwd');

const exists = promisify(fs.access);
const prettierIgnorePath = getPathFromCwd('.prettierignore');
const prettierConfigPath = path.join(
  __dirname,
  '../config/prettier/prettierConfig.js',
);

const runPrettier = async ({ write, listDifferent }) => {
  console.log(
    chalk.cyan(
      `${write ? 'Formatting' : 'Checking'} source code with Prettier`,
    ),
  );

  const prettierArgs = ['--config', prettierConfigPath];

  if (write) {
    prettierArgs.push('--write');
  }
  if (listDifferent) {
    prettierArgs.push('--list-different');
  }

  try {
    const ignoreExists = await exists(prettierIgnorePath);
    if (ignoreExists) {
      prettierArgs.push('--ignore-path', prettierIgnorePath);
    }
  } catch (err) {
    // don't error if `.prettierignore` not found
  }

  prettierArgs.push('**/*.{js,ts,tsx,md,less,css}');

  /*
   * Show Prettier output with stdio: inherit
   * The child process will use the parent process's stdin/stdout/stderr
   * See https://nodejs.org/api/child_process.html#child_process_options_stdio
   */
  const processOptions = {
    stdio: 'inherit',
  };

  console.log(chalk.gray(`prettier ${prettierArgs.join(' ')}`));

  try {
    await runBin({
      packageName: 'prettier',
      args: prettierArgs,
      options: processOptions,
    });
    console.log(chalk.cyan(`Prettier ${write ? 'format' : 'check'} complete`));
  } catch (exitCode) {
    if (listDifferent && exitCode === 1) {
      console.error(
        chalk.red('Error: The file(s) listed above failed the prettier check'),
      );
    } else {
      console.error(
        chalk.red('Error: Prettier check exited with exit code', exitCode),
      );
    }

    process.exit(1);
  }
};

module.exports = {
  check: () => runPrettier({ listDifferent: true }),
  write: () => runPrettier({ write: true }),
};
