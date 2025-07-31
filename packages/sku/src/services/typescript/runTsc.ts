import chalk from 'chalk';
import { runBin } from '#src/utils/runBin.js';
import { cwd } from '#src/utils/cwd.js';

const runTsc = () => {
  console.log(chalk.cyan(`Checking code with TypeScript compiler`));
  console.log(chalk.gray(`Path: ${cwd()}`));

  return runBin({
    packageName: 'typescript',
    binName: 'tsc',
    args: ['--project', cwd(), '--noEmit'],
    options: { stdio: 'inherit' },
  });
};

export default runTsc;
