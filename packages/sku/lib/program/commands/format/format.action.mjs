import { cyan } from 'chalk';
import { configureProject } from '../../../utils/configure.js';
import { fix as esLintFix } from '../../../runESLint.js';
import { write as prettierWrite } from '../../../runPrettier.js';

export const formatAction = async (paths) => {
  await configureProject();
  const pathsToCheck = paths.length > 0 ? paths : undefined;

  console.log(cyan('Formatting'));

  try {
    await esLintFix(pathsToCheck);
    await prettierWrite(pathsToCheck);
  } catch (e) {
    if (e) {
      console.error(e);
    }

    process.exit(1);
  }
  console.log(cyan('Formatting complete'));
};
