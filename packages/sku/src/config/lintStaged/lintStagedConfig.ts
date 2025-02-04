import { isYarn, getCommand } from '../../lib/packageManager.js';
import { lintExtensions } from '../../lib/lint.js';
import type { Config } from 'lint-staged';

const config: Config = {
  [`**/*.{${lintExtensions},md}`]: ['sku format', 'sku lint'],
  // Yarn lock integrity check
  ...(isYarn
    ? {
        '+(package.json|yarn.lock)':
          // The function form allows running the command without file arguments
          // https://github.com/lint-staged/lint-staged#example-run-tsc-on-changes-to-typescript-files-but-do-not-pass-any-filename-arguments
          () => getCommand('yarn', 'install', ['--check-files']),
      }
    : {}),
};

export default config;
