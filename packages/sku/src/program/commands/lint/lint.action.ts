import { check as esLintCheck } from '../../../services/eslint/runESLint.js';
import { check as prettierCheck } from '../../../services/prettier.js';
import { runTsc } from '../../../services/typescript/runTsc.js';

import { runVocabCompile } from '../../../services/vocab/runVocab.js';
import { configureProject } from '../../../utils/configure.js';
import { runLintChecks, type LintCheck } from '../../../utils/runLintChecks.js';
import type { SkuContext } from '../../../context/createSkuContext.js';
import { accentLight, critical } from '@sku-private/utils/console';

export const lintAction = async (
  paths: string[],
  { skuContext }: { skuContext: SkuContext },
) => {
  await configureProject(skuContext);
  const pathsToCheck = paths.length > 0 ? paths : undefined;

  console.log(accentLight('Linting'));

  await runVocabCompile(skuContext);

  const checks: LintCheck[] = [
    {
      name: 'TypeScript',
      run: () => runTsc(pathsToCheck),
    },
    {
      name: 'Prettier',
      run: () => prettierCheck(pathsToCheck),
    },
    {
      name: 'ESLint',
      run: () => esLintCheck({ paths: pathsToCheck }),
    },
  ];

  const hasFailure = await runLintChecks(checks);

  if (hasFailure) {
    console.error(critical('Linting failed'));
    process.exit(1);
  }

  console.log(accentLight('Linting complete'));
};
