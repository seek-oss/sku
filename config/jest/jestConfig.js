const escapeRegex = require('escape-string-regexp');
const { paths } = require('../../context');
const slash = '[/\\\\]'; // Cross-platform path delimiter regex
const compilePackagesRegex = paths.compilePackages
  .map((pkg) => `.*${escapeRegex(pkg)}`)
  .join('|');

module.exports = {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: paths.setupTests,
  prettierPath: require.resolve('prettier'),
  testMatch: [
    // Default values, but with 'ts' + 'tsx' support
    // (https://jestjs.io/docs/en/configuration.html#testmatch-array-string)
    '**/__tests__/**/*.(js|ts|tsx)',
    '**/?(*.)+(spec|test).(js|ts|tsx)',
  ],
  testPathIgnorePatterns: [
    `<rootDir>${slash}(${paths.target}|node_modules)${slash}`,
  ],
  moduleFileExtensions: ['js', 'json', 'ts', 'tsx'],
  moduleNameMapper: {
    '\\.(jpg|jpeg|png|gif|eot|otf|webp|svg|ttf|woff|woff2|mp4|webm|wav|mp3|m4a|aac|oga|svg)$':
      require.resolve('./fileMock'),

    // Mock seek-style-guide components
    // with a proxy object that echoes back the import name as a string,
    // e.g. `import { Text } from 'seek-style-guide/react'` resolves
    // to the string 'Text'. This way, snapshot tests won't break when
    // these packages get updated, which happens regularly. There's
    // still room for debate about whether this is a good idea or not...
    '^seek-style-guide/react': require.resolve('identity-obj-proxy'),
  },
  transform: {
    '\\.less$': require.resolve('./cssModulesTransform.js'),
    '\\.(ts|tsx)$': require.resolve('./tsBabelTransform.js'),
    '\\.js$': require.resolve('./jsBabelTransform.js'),
  },
  transformIgnorePatterns: [
    // Allow 'compilePackages' code to be transformed in tests by overriding
    // the default, which normally excludes everything in node_modules.
    `node_modules${slash}(?!(${compilePackagesRegex}))`,
  ],
  testURL: 'http://localhost', // @see https://github.com/facebook/jest/issues/6766
  watchPlugins: [
    require.resolve('jest-watch-typeahead/filename'),
    require.resolve('jest-watch-typeahead/testname'),
  ],
};
