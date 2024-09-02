// @ts-check
const exists = require('./exists');
const path = require('node:path');
const chalk = require('chalk');
const { runBin } = require('./runBin');
const { getPathFromCwd } = require('./cwd');
const { suggestScript } = require('./suggestScript');

const prettierIgnorePath = getPathFromCwd('.prettierignore');
const prettierConfigPath = path.join(
  __dirname,
  '../config/prettier/prettierConfig.js',
);

/**
 * @param {{ write?: boolean, listDifferent?: boolean, paths?: string[] }} options
 */
const runPrettier = async ({ write, listDifferent, paths }) => {
  console.log(
    chalk.cyan(`${write ? 'Formatting' : 'Checking'} code with Prettier`),
  );

  const prettierArgs = ['--config', prettierConfigPath, '--cache'];

  if (write) {
    prettierArgs.push('--write');
  }
  if (listDifferent) {
    prettierArgs.push('--list-different');
  }

  const ignoreExists = await exists(prettierIgnorePath);
  if (ignoreExists) {
    prettierArgs.push('--ignore-path', prettierIgnorePath);
  }

  const pathsToCheck = paths && paths.length > 0 ? paths : ['.'];

  prettierArgs.push(...pathsToCheck);

  console.log(chalk.gray(`Paths: ${pathsToCheck.join(' ')}`));

  try {
    await runBin({
      packageName: 'prettier',
      args: prettierArgs,
      /**
       * Show Prettier output with stdio: inherit
       * The child process will use the parent process's stdin/stdout/stderr
       * See https://nodejs.org/api/child_process.html#child_process_options_stdio
       */
      options: { stdio: 'inherit' },
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
        suggestScript('format');
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
  /** @param {string[] | undefined} paths */
  check: (paths) => runPrettier({ listDifferent: true, paths }),
  /** @param {string[] | undefined} paths */
  write: (paths) => runPrettier({ write: true, paths }),
};
