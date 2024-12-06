import debug from 'debug';
import jest from 'jest';

import isCI from '../../../isCI.js';
import { runVocabCompile } from '../../../runVocab.js';
import { configureProject } from '../../../utils/configure.js';

const { run } = jest;

const log = debug('sku:jest');

const testAction = async ({ args = [] } = {}) => {
  await configureProject();
  await runVocabCompile();

  // https://jestjs.io/docs/configuration#preset-string
  const jestPreset = 'sku';
  log(`Using '${jestPreset}' Jest preset`);

  const jestArgv = args;

  jestArgv.push('--preset', jestPreset);

  if (isCI) {
    jestArgv.push('--ci');
  }

  run(jestArgv);
};

export { testAction };
