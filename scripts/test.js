/* eslint-disable-next-line jest/no-jest-import */
const jest = require('jest');

const baseJestConfig = require('../config/jest/jestConfig');
const { argv } = require('../config/args');
const { jestDecorator } = require('../context');

const jestConfig = jestDecorator(baseJestConfig);

argv.push('--config', JSON.stringify(jestConfig));

jest.run(argv);
