const jest = require('jest');
const generateJestConfig = require('../config/jest/jest.config')
  .generateJestConfig;
const argv = process.argv.slice(2);
const builds = require('../config/builds');

const overrideConfig =
  Array.isArray(builds) && builds.length && builds[0].jestOverrideConfig
    ? builds[0].jestOverrideConfig
    : {};
const jestConfig = generateJestConfig(overrideConfig);

if (!process.env.CI && argv.indexOf('--coverage') < 0) {
  argv.push('--watch');
}

argv.push('--config', JSON.stringify(jestConfig));

jest.run(argv);
