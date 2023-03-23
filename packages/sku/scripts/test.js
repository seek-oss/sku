const jest = require('jest');

const isCI = require('../lib/isCI');
const baseJestConfig = require('../config/jest/jestConfig');
const { argv } = require('../config/args');
const { jestDecorator } = require('../context');

const { runVocabCompile } = require('../lib/runVocab');

// https://reactjs.org/blog/2022/03/08/react-18-upgrade-guide.html#configuring-your-testing-environment
process.env.IS_REACT_ACT_ENVIRONMENT = true;

(async () => {
  await runVocabCompile();

  const jestConfig = jestDecorator(baseJestConfig);

  argv.push('--config', JSON.stringify(jestConfig));

  if (isCI) {
    argv.push('--ci');
  }

  jest.run(argv);
})();
