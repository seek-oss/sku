/* eslint-disable-next-line jest/no-jest-import */
const jest = require('jest');

const baseJestConfig = require('../config/jest/jestConfig');
const { argv } = require('../config/args');
const { jestDecorator } = require('../context');

const isCI = require('../lib/isCI');

const { runVocabCompile } = require('../lib/runVocab');

(async () => {
  await runVocabCompile();

  const jestConfig = jestDecorator(baseJestConfig);

  if (!isCI && argv.indexOf('--coverage') < 0) {
    argv.push('--watch');
  }

  argv.push('--config', JSON.stringify(jestConfig));

  jest.run(argv);
})();
