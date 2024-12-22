import chalk from 'chalk';
import { check as esLintCheck } from '@/services/eslint/runESLint.js';
import { check as prettierCheck } from '@/services/prettier/runPrettier.js';
import runTsc from '@/lib/runTsc.js';

import { runVocabCompile } from '@/services/vocab/runVocab.js';
import { configureProject } from '@/utils/configure.js';
import { SkuContext } from '@/context/createSkuContext.js';

export const lintAction = async (
  paths: string[],
  { skuContext }: { skuContext: SkuContext },
) => {
  await configureProject(skuContext);
  const pathsToCheck = paths.length > 0 ? paths : undefined;

  console.log(chalk.cyan('Linting'));

  await runVocabCompile(skuContext);

  try {
    const hasPaths = typeof pathsToCheck !== 'undefined';
    const pathsIncludeTS =
      hasPaths &&
      pathsToCheck.filter(
        (filePath) => filePath.endsWith('.ts') || filePath.endsWith('.tsx'),
      ).length > 0;

    if (!hasPaths || pathsIncludeTS) {
      await runTsc();
    }

    await prettierCheck(pathsToCheck);
    await esLintCheck({ paths: pathsToCheck, skuContext });
  } catch (e) {
    if (e) {
      console.error(e);
    }

    process.exit(1);
  }

  console.log(chalk.cyan('Linting complete'));
};
