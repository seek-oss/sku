import chalk from 'chalk';
import { configureProject } from '@/utils/configure.js';
import { fix as esLintFix } from '@/services/eslint/runESLint.js';
import { write as prettierWrite } from '@/services/prettier/runPrettier.js';
import type { SkuContext } from '@/context/createSkuContext.js';

export const formatAction = async (
  paths: string[],
  { skuContext }: { skuContext: SkuContext },
) => {
  await configureProject(skuContext);
  const pathsToCheck = paths.length > 0 ? paths : undefined;

  console.log(chalk.cyan('Formatting'));

  try {
    await esLintFix({ paths: pathsToCheck });
    await prettierWrite(pathsToCheck);
  } catch (e) {
    if (e) {
      console.error(e);
    }

    process.exit(1);
  }
  console.log(chalk.cyan('Formatting complete'));
};
