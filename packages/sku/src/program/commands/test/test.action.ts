import debug from 'debug';
import { execSync } from 'node:child_process';

import isCI from '@/utils/isCI.js';
import { runVocabCompile } from '@/services/vocab/runVocab.js';
import { configureProject } from '@/utils/configure.js';
import type { SkuContext } from '@/context/createSkuContext.js';

const log = debug('sku:jest');

const testAction = async (
  {
    skuContext,
  }: {
    skuContext: SkuContext;
  },
  { args = [] }: { args: string[] },
) => {
  await configureProject(skuContext);
  await runVocabCompile(skuContext);

  // https://jestjs.io/docs/configuration#preset-string
  const jestPreset = 'sku';
  log(`Using '${jestPreset}' Jest preset`);

  const jestArgv = [...args];

  jestArgv.push('--preset', jestPreset);

  if (isCI) {
    jestArgv.push('--ci');
  }

  execSync(
    `NODE_OPTIONS='--experimental-vm-modules --disable-warning=ExperimentalWarning' npx jest ${jestArgv.join(' ')}`,
    { stdio: 'inherit' },
  );
};

export { testAction };
