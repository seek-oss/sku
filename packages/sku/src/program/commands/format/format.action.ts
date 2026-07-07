import { configureProject } from '../../../utils/configure.js';
import { fix as esLintFix } from '../../../services/eslint/runESLint.js';
import { write as prettierWrite } from '../../../services/prettier.js';
import type { SkuContext } from '../../../context/createSkuContext.js';
import { accentLight, critical } from '@sku-private/utils/console';
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
      name: 'ESLint',
      run: () => esLintFix({ paths: pathsToCheck }),
    },
    {
      name: 'Prettier',
      run: () => prettierWrite(pathsToCheck),
    },
  ];

  const hasFailure = await runLintChecks(checks);

  if (hasFailure) {
    console.error(critical('Formatting failed'));
    process.exit(1);
  }

  console.log(accentLight('Formatting complete'));
};
