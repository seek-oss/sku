const debug = require('debug');
const jest = require('jest');

const isCI = require('../lib/isCI');
const { argv, watch } = require('../config/args');
const { runVocabCompile } = require('../lib/runVocab');

const log = debug('sku:jest');

(async () => {
  await runVocabCompile();

  // https://jestjs.io/docs/configuration#preset-string
  const jestPreset = 'sku';
  log(`Using '${jestPreset}' Jest preset`);

  const jestArgv = [...argv];

  jestArgv.push('--preset', jestPreset);

  if (isCI) {
    jestArgv.push('--ci');
  }

  if (watch) {
    jestArgv.push('--watch');
  }

  jest.run(jestArgv);
})();
