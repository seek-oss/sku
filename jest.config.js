const path = require('path');

module.exports = {
  setupTestFrameworkScriptFile: path.resolve(
    __dirname,
    'test/utils/jestSetup.js'
  ),
  testURL: 'http://localhost',
  testMatch: ['**/*.test.js'],
  testPathIgnorePatterns: ['test/.*/src'],
  preset: 'jest-puppeteer'
};
