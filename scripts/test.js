/* eslint-disable-next-line jest/no-jest-import */
const jest = require('jest');

const isCI = require('../lib/isCI');
const baseJestConfig = require('../config/jest/jestConfig');
const { argv } = require('../config/args');
const { jestDecorator } = require('../context');

const { runVocabCompile } = require('../lib/runVocab');

(async () => {
  await runVocabCompile();

  const jestConfig = jestDecorator(baseJestConfig);

  argv.push('--config', JSON.stringify(jestConfig));

  if (isCI) {
    argv.push('--ci');
  }

  jest.run(argv);
})();
