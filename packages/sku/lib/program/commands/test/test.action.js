const debug = require('debug');
const jest = require('jest');

const isCI = require('../../../isCI');
const { runVocabCompile } = require('../../../runVocab');
const { configureProject } = require('../../../utils/config-validators');

const log = debug('sku:jest');

const testAction = async ({ watch, args }) => {
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

  if (watch) {
    jestArgv.push('--watch');
  }

  jest.run(jestArgv);
};

module.exports = testAction;
