const debug = require('debug');
const jest = require('jest');

const isCI = require('../../../isCI');
const { runVocabCompile } = require('../../../runVocab');
const { configureProject } = require('../../../utils/configure');

const log = debug('sku:jest');

const testAction = async ({ args }) => {
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

  jest.run(jestArgv);
};

module.exports = testAction;
