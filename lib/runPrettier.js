const fs = require('fs');
const path = require('path');
const { promisify } = require('util');
const chalk = require('chalk');
const { runBin } = require('./runBin');
const { getPathFromCwd } = require('./cwd');
const { suggestScript } = require('./suggestScript');

const exists = promisify(fs.stat);
const prettierIgnorePath = getPathFromCwd('.prettierignore');
const prettierConfigPath = path.join(
  __dirname,
  '../config/prettier/prettierConfig.js',
);

const runPrettier = async ({ write, listDifferent, paths }) => {
  console.log(
    chalk.cyan(`${write ? 'Formatting' : 'Checking'} code with Prettier`),
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

  const pathsToCheck =
    paths && paths.length > 0 ? paths : ['**/*.{js,ts,tsx,md,less,css}'];

  prettierArgs.push(...pathsToCheck);
  /*
   * Show Prettier output with stdio: inherit
   * The child process will use the parent process's stdin/stdout/stderr
   * See https://nodejs.org/api/child_process.html#child_process_options_stdio
   */
  const processOptions = {
    stdio: 'inherit',
  };

  console.log(chalk.gray(`Paths: ${pathsToCheck.join(' ')}`));

  try {
    await runBin({
      packageName: 'prettier',
      args: prettierArgs,
      options: processOptions,
    });
  } catch (exitCode) {
    if (exitCode === 2) {
      console.warn(
        chalk.yellow('Warning: No files matching', pathsToCheck.join(' ')),
      );
    } else {
      if (listDifferent && exitCode === 1) {
        console.error(
          chalk.red(
            'Error: The file(s) listed above failed the prettier check',
          ),
        );
        await suggestScript('format');
      } else {
        console.error(
          chalk.red('Error: Prettier check exited with exit code', exitCode),
        );
      }
      throw new Error();
    }
  }
};

module.exports = {
  check: paths => runPrettier({ listDifferent: true, paths }),
  write: paths => runPrettier({ write: true, paths }),
};
