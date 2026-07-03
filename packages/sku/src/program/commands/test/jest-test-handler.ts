import { createDebug } from 'obug';
import { run } from 'jest';

import isCI from '../../../utils/isCI.js';

const log = createDebug('sku:jest');

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
