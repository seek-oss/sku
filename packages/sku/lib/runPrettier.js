// @ts-check
import exists from './exists';
import path, { dirname } from 'node:path';
import { yellow, red, gray, cyan } from 'chalk';
import { runBin } from './runBin';
import { getPathFromCwd } from './cwd';
import { suggestScript } from './suggestScript';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

const prettierIgnorePath = getPathFromCwd('.prettierignore');
const prettierConfigPath = path.join(
  __dirname,
  '../config/prettier/prettierConfig.js',
);

/**
 * @param {{ write?: boolean, listDifferent?: boolean, paths?: string[] }} options
 */
const runPrettier = async ({ write, listDifferent, paths }) => {
  console.log(cyan(`${write ? 'Formatting' : 'Checking'} code with Prettier`));

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

  console.log(gray(`Paths: ${pathsToCheck.join(' ')}`));

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
        yellow('Warning: No files matching', pathsToCheck.join(' ')),
      );
    } else {
      if (listDifferent && exitCode === 1) {
        console.error(
          red('Error: The file(s) listed above failed the prettier check'),
        );
        suggestScript('format');
      } else {
        console.error(
          red('Error: Prettier check exited with exit code', exitCode),
        );
      }
      throw new Error();
    }
  }
};

/** @param {string[] | undefined} paths */
export const check = (paths) => runPrettier({ listDifferent: true, paths });

/** @param {string[] | undefined} paths */
export const write = (paths) => runPrettier({ write: true, paths });
