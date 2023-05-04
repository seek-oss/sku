/** @type {import('jest').Config} */
module.exports = {
  preset: 'jest-puppeteer',
  setupFilesAfterEnv: ['<rootDir>/test-utils/jestSetup.js'],
  snapshotSerializers: [
    '<rootDir>/test-utils/appSnapshotSerializer.js',
    '<rootDir>/test-utils/htmlSnapshotSerializer.js',
    '<rootDir>/test-utils/cssSnapshotSerializer.js',
  ],
  testPathIgnorePatterns: [
    '/node_modules/',
    '<rootDir>/packages/sku/scripts/test.js',
    '<rootDir>/fixtures/.*/src',
  ],
  watchPlugins: [
    'jest-watch-typeahead/filename',
    'jest-watch-typeahead/testname',
  ],
};
