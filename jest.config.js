const path = require('path');
module.exports = {
  setupFilesAfterEnv: [path.resolve(__dirname, 'test/utils/jestSetup.js')],
  testURL: 'http://localhost',
  testMatch: ['**/*.test.js'],
  testPathIgnorePatterns: ['test/.*/src'],
  preset: 'jest-puppeteer',
  watchPlugins: [
    'jest-watch-typeahead/filename',
    'jest-watch-typeahead/testname',
  ],
};
