const debug = require('debug');
const jest = require('jest');

const isCI = require('../lib/isCI');
const { argv, watch } = require('../config/args');
const { runVocabCompile } = require('../lib/runVocab');

const log = debug('sku:jest');

(async () => {
  await runVocabCompile();

  // https://jestjs.io/docs/configuration#preset-string
  const { preset } = require('../config/jest');
  log(`Using Jest preset at ${preset}`);

  const jestArgv = [...argv];

  jestArgv.push('--preset', preset);

  if (isCI) {
    jestArgv.push('--ci');
  }

  if (watch) {
    jestArgv.push('--watch');
  }

  jest.run(jestArgv);
})();
