import escapeRegex from 'escape-string-regexp';
import { fileURLToPath } from 'node:url';
import { cwd } from '@/utils/cwd.js';
import { getSkuContext } from '@/context/createSkuContext.js';
import type { Config } from 'jest';

const { paths, rootResolution, jestDecorator } = getSkuContext();

const slash = '[/\\\\]'; // Cross-platform path delimiter regex
const compilePackagesRegex = paths.compilePackages
  .map((pkg) => `.*${escapeRegex(pkg)}`)
  .join('|');

export default jestDecorator({
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: paths.setupTests,
  prettierPath: fileURLToPath(import.meta.resolve('prettier')),
  modulePaths: rootResolution ? [cwd()] : undefined,
  testPathIgnorePatterns: [
    `<rootDir>${slash}(${paths.target}|node_modules)${slash}`,
  ],
  moduleFileExtensions: ['js', 'json', 'ts', 'tsx'],
  moduleNameMapper: {
    '\\.(jpg|jpeg|png|gif|eot|otf|webp|svg|ttf|woff|woff2|mp4|webm|wav|mp3|m4a|aac|oga|svg|avif|bmp)$':
      fileURLToPath(import.meta.resolve('./fileMock.cjs')),
  },
  transform: {
    '\\.css\\.ts$': fileURLToPath(
      import.meta.resolve('@vanilla-extract/jest-transform'),
    ),
    '\\.[cm]?tsx?$': fileURLToPath(
      import.meta.resolve('./tsBabelTransform.js'),
    ),
    '\\.[cm]?jsx?$': fileURLToPath(
      import.meta.resolve('./jsBabelTransform.js'),
    ),
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
  testEnvironmentOptions: {
    globalsCleanup: 'on',
  },
}) satisfies Config;
