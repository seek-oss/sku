import exists from '../utils/exists.js';
import { runBin } from '../utils/runBin.js';
import { getPathFromCwd } from '@sku-private/utils';
import { suggestScript } from '../utils/suggestScript.js';
import { accentLight, critical, secondary } from '@sku-private/utils/console';
import type { LintResult } from '../utils/runLintChecks.js';

const prettierIgnorePath = getPathFromCwd('.prettierignore');
const prettierConfigPath = import.meta.resolve('sku/config/prettier');

const runPrettier = async ({
  write,
  listDifferent,
  paths,
}: {
  write?: boolean;
  listDifferent?: boolean;
  paths?: string[];
}): Promise<LintResult> => {
  console.log(
    accentLight(`${write ? 'Formatting' : 'Checking'} code with Prettier`),
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

  console.log(secondary(`Paths: ${pathsToCheck.join(' ')}`));

  const { exitCode } = await runBin({
    packageName: 'prettier',
    args: prettierArgs,
    /**
     * Show Prettier output with stdio: inherit
     * The child process will use the parent process's stdin/stdout/stderr
     * See https://nodejs.org/api/child_process.html#child_process_options_stdio
     */
    options: { stdio: 'inherit' },
  });
  if (listDifferent && exitCode === 1) {
    console.error(
      critical('Error: The file(s) listed above failed the prettier check'),
    );
    suggestScript('format');
  }

  return { exitCode };
};

export const check = (paths?: string[]) =>
  runPrettier({ listDifferent: true, paths });

export const write = (paths?: string[]) => runPrettier({ write: true, paths });
