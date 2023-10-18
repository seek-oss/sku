const escapeRegex = require('escape-string-regexp');
const { cwd } = require('../../lib/cwd');
const { paths, rootResolution, jestDecorator } = require('../../context');

const slash = '[/\\\\]'; // Cross-platform path delimiter regex
const compilePackagesRegex = paths.compilePackages
  .map((pkg) => `.*${escapeRegex(pkg)}`)
  .join('|');

/** @type {import('jest').Config} */
module.exports = jestDecorator({
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: paths.setupTests,
  prettierPath: require.resolve('prettier'),
  modulePaths: rootResolution ? [cwd()] : undefined,
  testMatch: [
    // Default values, but with 'ts' + 'tsx' support
    // (https://jestjs.io/docs/en/configuration.html#testmatch-array-string)
    '**/__tests__/**/*.(js|ts|tsx)',
    '**/?(*.)+(spec|test).(js|ts|tsx)',
  ],
  testPathIgnorePatterns: [
    `<rootDir>${slash}(${paths.target}|node_modules|.pnpm_store)${slash}`,
  ],
  moduleFileExtensions: ['js', 'json', 'ts', 'tsx'],
  moduleNameMapper: {
    '\\.(jpg|jpeg|png|gif|eot|otf|webp|svg|ttf|woff|woff2|mp4|webm|wav|mp3|m4a|aac|oga|svg)$':
      require.resolve('./fileMock'),
  },
  transform: {
    '\\.less$': require.resolve('./cssModulesTransform.js'),
    '\\.css\\.ts$': require.resolve('@vanilla-extract/jest-transform'),
    '\\.tsx?$': require.resolve('./tsBabelTransform.js'),
    '\\.[cm]?js$': require.resolve('./jsBabelTransform.js'),
  },
  transformIgnorePatterns: [
    // Allow 'compilePackages' code to be transformed in tests by overriding
    // the default, which normally excludes everything in node_modules.
    `node_modules${slash}(?!(${compilePackagesRegex}))`,
  ],
  watchPlugins: [
    require.resolve('jest-watch-typeahead/filename'),
    require.resolve('jest-watch-typeahead/testname'),
  ],
});
