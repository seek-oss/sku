const {
  testPathIgnorePatterns: _testPathIgnorePatterns,
  ...baseJestConfig
} = require('./jest.config');

/** @type {import('jest').Config} */
module.exports = {
  ...baseJestConfig,
  // Ensure that the only test that can be run with this config is sku-init.test.js
  testRegex: 'sku-init\\.test\\.js$',
};
