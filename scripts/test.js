const jest = require('jest');
const baseJestConfig = require('../config/jest/jestConfig');
const { argv } = require('../config/args');
const builds = require('../config/builds');

//Decorate jest config is not supported for monorepo
const jestConfig =
  builds.length === 1
    ? builds[0].jestDecorator(baseJestConfig)
    : baseJestConfig;

if (!process.env.CI && argv.indexOf('--coverage') < 0) {
  argv.push('--watch');
}

argv.push('--config', JSON.stringify(jestConfig));

jest.run(argv);
