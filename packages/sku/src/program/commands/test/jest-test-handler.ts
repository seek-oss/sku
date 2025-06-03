import debug from 'debug';
import jest from 'jest';

import isCI from '@/utils/isCI.js';
import { runVocabCompile } from '@/services/vocab/runVocab.js';
import { configureProject } from '@/utils/configure.js';
import type { SkuContext } from '@/context/createSkuContext.js';

const log = debug('sku:jest');

const { run } = jest;

export const runJestTests = async (
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

  run(jestArgv);
};
