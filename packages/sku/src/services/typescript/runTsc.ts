import chalk from 'chalk';
import { runBin } from '../../utils/runBin.js';
import { cwd } from '@sku-private/utils';

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
