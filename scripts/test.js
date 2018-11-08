const jest = require('jest');

const baseJestConfig = require('../config/jest/jestConfig');
const { argv } = require('../config/args');
const { jestDecorator } = require('../config/projectConfig');

const jestConfig = jestDecorator(baseJestConfig);

argv.push('--config', JSON.stringify(jestConfig));

jest.run(argv);
