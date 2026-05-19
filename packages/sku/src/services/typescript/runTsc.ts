import { accentLight, secondary } from '@sku-private/utils/console';
import { runBin } from '../../utils/runBin.js';
import { cwd } from '@sku-private/utils';

const runTsc = () => {
  console.log(accentLight(`Checking code with TypeScript compiler`));
  console.log(secondary(`Path: ${cwd()}`));

  return runBin({
    packageName: 'typescript',
    binName: 'tsc',
    args: ['--project', cwd(), '--noEmit'],
    options: { stdio: 'inherit' },
  });
};

export default runTsc;
