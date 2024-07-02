const path = require('node:path');
const debug = require('debug');
const jest = require('jest');

const isCI = require('../lib/isCI');
const { argv, watch } = require('../config/args');
const { runVocabCompile } = require('../lib/runVocab');

const log = debug('sku:jest');
// https://reactjs.org/blog/2022/03/08/react-18-upgrade-guide.html#configuring-your-testing-environment
process.env.IS_REACT_ACT_ENVIRONMENT = true;

(async () => {
  await runVocabCompile();

  // https://jestjs.io/docs/configuration#preset-string
  const jestPreset = require.resolve('../config/jest/jest-preset');
  log(`Using Jest preset at ${jestPreset}`);

  const jestArgv = [...argv];

  jestArgv.push('--preset', path.dirname(jestPreset));

  if (isCI) {
    jestArgv.push('--ci');
  }

  if (watch) {
    jestArgv.push('--watch');
  }

  jest.run(jestArgv);
})();
