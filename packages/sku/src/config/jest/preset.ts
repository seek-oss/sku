import { fileURLToPath } from 'node:url';
import { getSkuContext } from '../../context/createSkuContext.js';
import type { Config } from 'jest';

const { paths, jestDecorator } = await getSkuContext();

const slash = '[/\\\\]'; // Cross-platform path delimiter regex
// ESM packages that Jest must transform (default is to ignore all of node_modules).
// react-router v8+ is ESM-only; cookie-es is its runtime dependency.
const packagesToTransformRegex = [
  ...(await paths.compilePackages()),
  'react-router',
  'cookie-es',
]
  .map((pkg) => `.*${RegExp.escape(pkg)}`)
  .join('|');

export default jestDecorator({
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: paths.setupTests,
  prettierPath: fileURLToPath(import.meta.resolve('prettier')),
  testPathIgnorePatterns: [
    `<rootDir>${slash}(${paths.target}|node_modules)${slash}`,
  ],
  moduleFileExtensions: ['js', 'json', 'ts', 'tsx'],
  moduleNameMapper: {
    '\\.(jpg|jpeg|png|gif|eot|otf|webp|svg|ttf|woff|woff2|mp4|webm|wav|mp3|m4a|aac|oga|svg|avif|bmp)$':
      fileURLToPath(import.meta.resolve('#jest/file-mock')),
  },
  transform: {
    '\\.css\\.ts$': fileURLToPath(
      import.meta.resolve('@vanilla-extract/jest-transform'),
    ),
    '\\.[cm]?tsx?$': fileURLToPath(import.meta.resolve('#jest/ts-transform')),
    '\\.[cm]?jsx?$': fileURLToPath(import.meta.resolve('#jest/js-transform')),
  },
  transformIgnorePatterns: [
    // Transform compilePackages and known ESM-only deps; ignore the rest of
    // node_modules (Jest's default).
    `node_modules${slash}(?!(${packagesToTransformRegex}))`,
  ],
  watchPlugins: [
    fileURLToPath(import.meta.resolve('jest-watch-typeahead/filename')),
    fileURLToPath(import.meta.resolve('jest-watch-typeahead/testname')),
  ],
  testEnvironmentOptions: {
    globalsCleanup: 'on',
  },
}) satisfies Config;
