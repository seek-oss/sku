const debug = require('debug');
const jest = require('jest');

const isCI = require('../lib/isCI');
const { argv } = require('../config/args');
const { runVocabCompile } = require('../lib/runVocab');

const log = debug('sku:jest');

(async () => {
  await runVocabCompile();

  // https://jestjs.io/docs/configuration#preset-string
  const { preset } = require('../config/jest');
  log(`Using Jest preset at ${preset}`);

  argv.push('--preset', preset);

  if (isCI) {
    argv.push('--ci');
  }

  jest.run(argv);
})();
