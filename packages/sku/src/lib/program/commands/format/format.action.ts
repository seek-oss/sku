import chalk from 'chalk';
import { configureProject } from '../../../utils/configure.js';
import { fix as esLintFix } from '../../../runESLint.js';
import { write as prettierWrite } from '../../../runPrettier.js';

export const formatAction = async (paths: string[]) => {
  await configureProject();
  const pathsToCheck = paths.length > 0 ? paths : undefined;

  console.log(chalk.cyan('Formatting'));

  try {
    await esLintFix(pathsToCheck);
    await prettierWrite(pathsToCheck);
  } catch (e) {
    if (e) {
      console.error(e);
    }

    process.exit(1);
  }
  console.log(chalk.cyan('Formatting complete'));
};
