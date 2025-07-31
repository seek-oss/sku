import debug from 'debug';
import { run } from 'jest';

import isCI from '#src/utils/isCI.js';

const log = debug('sku:jest');

export const runJestTests = async ({ args = [] }: { args: string[] }) => {
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
