# @sku-lib/codemod

## 0.3.2

### Patch Changes

- Logging when a worker starts will now be a debug log ([#1414](https://github.com/seek-oss/sku/pull/1414))

## 0.3.1

### Patch Changes

- Simplify jest mock type matching rule ([#1409](https://github.com/seek-oss/sku/pull/1409))

- Simplify logic for making mock factories async within `jest.mock` calls ([#1406](https://github.com/seek-oss/sku/pull/1406))

- Update existing `vitest` import if detected ([#1408](https://github.com/seek-oss/sku/pull/1408))

## 0.3.0

### Minor Changes

- Add support for converting failing tests such as `test.failing` to `test.fails` ([#1401](https://github.com/seek-oss/sku/pull/1401))

- Add support for detecting chained test methods such as `it.each` and `test.skip.each` ([#1400](https://github.com/seek-oss/sku/pull/1400))

- Add support for converting `jest.Mock` and `jest.MockedFunction` typecasts into `vi.mocked` function calls ([#1396](https://github.com/seek-oss/sku/pull/1396))

## 0.2.0

### Minor Changes

- Only accept paths to directories instead of any glob expression ([#1388](https://github.com/seek-oss/sku/pull/1388))

  **BREAKING CHANGE**:
  Globs are no longer accepted as input to the CLI. Only paths to directories are accepted.

- Add `jest-to-vitest` codemod ([#1388](https://github.com/seek-oss/sku/pull/1388))

  The `jest-to-vitest` codemod automates the migration of test files from Jest to Vitest. The following code patterns are transformed:
  - Renaming `jest` to `vi`
  - Importing globals such as `expect, it, describe, beforeAll`
  - Updating `jest.requireActual` to `await vi.importActual`
  - Wrapping functions that call `await vi.importActual` with `async`

  **EXAMPLE USAGE**:

  ```sh
  pnpm dlx @sku-lib/codemod jest-to-vitest .
  ```

### Patch Changes

- Correctly calculate changed files ([#1388](https://github.com/seek-oss/sku/pull/1388))

- Restrict files to only those with JavaScript and TypeScript extensions ([#1388](https://github.com/seek-oss/sku/pull/1388))

## 0.1.1

### Patch Changes

- Move `typescript` to dev dependencies ([#1368](https://github.com/seek-oss/sku/pull/1368))

- Use async `glob` to find files ([#1368](https://github.com/seek-oss/sku/pull/1368))

## 0.1.0

### Minor Changes

- Initial release. ([#1237](https://github.com/seek-oss/sku/pull/1237))

  Add `transform-vite-loadable` codemod to convert `sku/@loadable/component` imports to `sku/vite/loadable` imports.
