import { configureProject } from '../../../utils/configure.js';
import { fix as esLintFix } from '../../../services/eslint/runESLint.js';
import { write as prettierWrite } from '../../../services/prettier.js';
import type { SkuContext } from '../../../context/createSkuContext.js';
import { accentLight } from '@sku-private/utils/console';
import { type LintCheck, runLintChecks } from '../../../utils/runLintChecks.js';

export const formatAction = async (
  paths: string[],
  { skuContext }: { skuContext: SkuContext },
) => {
  await configureProject(skuContext);
  const pathsToCheck = paths.length > 0 ? paths : undefined;

  console.log(accentLight('Formatting'));

  const checks: LintCheck[] = [
    {
      name: 'Prettier',
      run: () => prettierWrite(pathsToCheck),
    },
    {
      name: 'ESLint',
      run: () => esLintFix({ paths: pathsToCheck }),
    },
  ];

  await runLintChecks(checks);

  // Errors will be logged by the lint checks themselves, but format will always pass
  console.log(accentLight('Formatting complete'));
};
