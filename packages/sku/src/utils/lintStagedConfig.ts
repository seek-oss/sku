import { isYarn, getCommand } from '@sku-lib/utils';
import { lintExtensions } from '../services/eslint/lint.js';
import type { Configuration } from 'lint-staged';

const config: Configuration = {
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
