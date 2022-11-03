/** @type {import('jest').Config} */
module.exports = {
  preset: 'jest-puppeteer',
  setupFilesAfterEnv: ['<rootDir>/test/utils/jestSetup.js'],
  testPathIgnorePatterns: ['test/.*/src', '/node_modules/'],
  watchPlugins: [
    'jest-watch-typeahead/filename',
    'jest-watch-typeahead/testname',
  ],
};
