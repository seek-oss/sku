/** @type {import('jest').Config} */
module.exports = {
  preset: 'jest-puppeteer',
  setupFilesAfterEnv: ['<rootDir>/test/utils/jestSetup.js'],
  testPathIgnorePatterns: [
    '/node_modules/',
    '<rootDir>/scripts/test.js',
    '<rootDir>/test/.*/src',
    '<rootDir>/fixtures/.*/src',
  ],
  watchPlugins: [
    'jest-watch-typeahead/filename',
    'jest-watch-typeahead/testname',
  ],
};
