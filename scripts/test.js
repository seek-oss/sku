const jest = require('jest');
const baseJestConfig = require('../config/jest/jest.config');
const argv = process.argv.slice(2);
const builds = require('../config/builds');

const jestConfig = builds[0].jestDecorator(baseJestConfig);

if (!process.env.CI && argv.indexOf('--coverage') < 0) {
  argv.push('--watch');
}

argv.push('--config', JSON.stringify(jestConfig));

jest.run(argv);
