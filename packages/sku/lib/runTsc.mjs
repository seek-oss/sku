// @ts-check
import { cyan, gray } from 'chalk';
import { runBin } from './runBin';
import { cwd } from './cwd';

const runTsc = () => {
  console.log(cyan(`Checking code with TypeScript compiler`));
  console.log(gray(`Path: ${cwd()}`));

  return runBin({
    packageName: 'typescript',
    binName: 'tsc',
    args: ['--project', cwd(), '--noEmit'],
    options: { stdio: 'inherit' },
  });
};

export default runTsc;
