/** @type {import('jest').Config} */
module.exports = {
  transform: {
    '^.+\\.(t|j)sx?$': '@swc/jest',
  },
  preset: 'jest-puppeteer',
  setupFilesAfterEnv: ['<rootDir>/test-utils/jestSetup.ts'],
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
