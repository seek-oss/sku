import { cyan } from 'chalk';
import { check as esLintCheck } from '../../../runESLint.js';
import { check as prettierCheck } from '../../../runPrettier.js';
import runTsc from '../../../runTsc.js';

import { runVocabCompile } from '../../../runVocab.js';
import { configureProject } from '../../../utils/configure.js';

export const lintAction = async (paths) => {
  await configureProject();
  const pathsToCheck = paths.length > 0 ? paths : undefined;

  console.log(cyan('Linting'));

  await runVocabCompile();

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
    await esLintCheck(pathsToCheck);
  } catch (e) {
    if (e) {
      console.error(e);
    }

    process.exit(1);
  }

  console.log(cyan('Linting complete'));
};
