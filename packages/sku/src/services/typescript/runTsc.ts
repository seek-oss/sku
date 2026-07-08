import { accentLight, secondary } from '@sku-private/utils/console';
import { runBin } from '../../utils/runBin.js';
import { cwd } from '@sku-private/utils';
import type { LintResult } from '../../utils/runLintChecks.js';

export const runTsc = async (pathsToCheck?: string[]): Promise<LintResult> => {
  if (pathsToCheck && pathsToCheck.length > 0) {
    console.log(accentLight(`Skipping TypeScript check`));
    console.log(
      secondary(`Typescript checks are skipped when file paths are provided`),
    );
    return { exitCode: 0 };
  }

  console.log(accentLight(`Checking code with TypeScript compiler`));
  console.log(secondary(`Path: ${cwd()}`));

  return runBin({
    packageName: 'typescript',
    binName: 'tsc',
    args: ['--project', cwd(), '--noEmit'],
    options: { stdio: 'inherit' },
  });
};
