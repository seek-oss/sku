import escapeRegex from 'escape-string-regexp';
import { fileURLToPath } from 'node:url';
import { cwd } from '../../lib/cwd';
import { paths, rootResolution, jestDecorator } from '../../context';

const slash = '[/\\\\]'; // Cross-platform path delimiter regex
const compilePackagesRegex = paths.compilePackages
  .map((pkg) => `.*${escapeRegex(pkg)}`)
  .join('|');

/** @type {import('jest').Config} */
export default jestDecorator({
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: paths.setupTests,
  prettierPath: fileURLToPath(import.meta.resolve('prettier')),
  modulePaths: rootResolution ? [cwd()] : undefined,
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
      fileURLToPath(import.meta.resolve('./fileMock')),
  },
  transform: {
    '\\.css\\.ts$': fileURLToPath(
      import.meta.resolve('@vanilla-extract/jest-transform'),
    ),
    '\\.tsx?$': fileURLToPath(import.meta.resolve('./tsBabelTransform.js')),
    '\\.[cm]?js$': fileURLToPath(import.meta.resolve('./jsBabelTransform.js')),
  },
  transformIgnorePatterns: [
    // Allow 'compilePackages' code to be transformed in tests by overriding
    // the default, which normally excludes everything in node_modules.
    `node_modules${slash}(?!(${compilePackagesRegex}))`,
  ],
  watchPlugins: [
    fileURLToPath(import.meta.resolve('jest-watch-typeahead/filename')),
    fileURLToPath(import.meta.resolve('jest-watch-typeahead/testname')),
  ],
});
