import escapeRegex from 'escape-string-regexp';
import { cwd } from '@sku-lib/utils';
import { getSkuContext } from '../../context/createSkuContext.js';
import type { Config } from 'jest';

const { paths, rootResolution, jestDecorator } = getSkuContext();

const slash = '[/\\\\]'; // Cross-platform path delimiter regex
const compilePackagesRegex = paths.compilePackages
  .map((pkg) => `.*${escapeRegex(pkg)}`)
  .join('|');

export default jestDecorator({
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: paths.setupTests,
  prettierPath: require.resolve('prettier'),
  modulePaths: rootResolution ? [cwd()] : undefined,
  testPathIgnorePatterns: [
    `<rootDir>${slash}(${paths.target}|node_modules)${slash}`,
  ],
  moduleFileExtensions: ['js', 'json', 'ts', 'tsx'],
  moduleNameMapper: {
    '\\.(jpg|jpeg|png|gif|eot|otf|webp|svg|ttf|woff|woff2|mp4|webm|wav|mp3|m4a|aac|oga|svg|avif|bmp)$':
      require.resolve('./fileMock.cjs'),
  },
  transform: {
    '\\.css\\.ts$': require.resolve('@vanilla-extract/jest-transform'),
    '\\.[cm]?tsx?$': require.resolve('./tsBabelTransform.js'),
    '\\.[cm]?jsx?$': require.resolve('./jsBabelTransform.js'),
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
  testEnvironmentOptions: {
    globalsCleanup: 'on',
  },
}) satisfies Config;
