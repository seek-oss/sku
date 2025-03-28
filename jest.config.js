/** @type {import('jest').Config} */
module.exports = {
  transform: {
    '^.+\\.(t|j)sx?$': [
      '@swc/jest',
      {
        module: {
          type: 'es6',

          // These are defaults.
          strict: false,
          strictMode: true,
          lazy: false,
          noInterop: false,
          preserveImportMeta: true,
        },
        jsc: {
          baseUrl: '.',
          paths: {
            '@/*': ['./packages/sku/src/*'],
          },
        },
      },
    ],
  },
  ...(process.env.CI
    ? {
        maxWorkers: 4,
      }
    : {}),
  preset: 'jest-puppeteer',
  moduleNameMapper: {
    '(.+)\\.js': '$1',
  },
  setupFilesAfterEnv: ['<rootDir>/test-utils/jestSetup.ts'],
  snapshotSerializers: [
    '<rootDir>/test-utils/appSnapshotSerializer.cjs',
    '<rootDir>/test-utils/htmlSnapshotSerializer.cjs',
    '<rootDir>/test-utils/cssSnapshotSerializer.cjs',
  ],
  extensionsToTreatAsEsm: ['.ts'],
  testPathIgnorePatterns: [
    '/node_modules/',
    '<rootDir>/packages/sku/scripts/test.js',
    '<rootDir>/fixtures/.*',
    '<rootDir>/tests/sku-init/sku-init.test.js',
  ],
  watchPlugins: [
    'jest-watch-typeahead/filename',
    'jest-watch-typeahead/testname',
  ],
};
