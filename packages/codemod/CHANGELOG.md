# @sku-lib/codemod

## 1.2.1

### Patch Changes

- jest-to-vitest: Properly handle `await expect()` generic syntax ([#1457](https://github.com/seek-oss/sku/pull/1457))

## 1.2.0

### Minor Changes

- jest-to-vitest: Transform generics in `.resolves`/`.rejects` expect chains with `satisfies` operator ([#1442](https://github.com/seek-oss/sku/pull/1442))

  ```diff
  - expect(result).resolves.toEqual<MyType>({});
  + expect(result).resolves.toEqual({} satisfies MyType);

  - expect(promise).rejects.toThrow<ErrorType>(error);
  + expect(promise).rejects.toThrow(error satisfies ErrorType);
  ```

- jest-to-vitest: Update codemod to transform `jest.beforeAll/beforeEach/afterAll/afterEach` calls with function references into arrow functions ([#1440](https://github.com/seek-oss/sku/pull/1440))

  ```diff
  -  beforeAll(someSetupFunction)
  +  beforeAll(() => { someSetupFunction() })
  ```

- jest-to-vitest: Add support for transforming `jest.fn` calls with TypeScript generics. ([#1445](https://github.com/seek-oss/sku/pull/1445))

  ```diff
  - const middleware = jest.fn<void, Parameters<Middleware>>();
  + const middleware = vi.fn<(...args: Parameters<Middleware>) => void>();

  - const callback = jest.fn<string, [number, boolean]>();
  + const callback = vi.fn<(...args: [number, boolean]) => string>();
  ```

## 1.1.0

### Minor Changes

- jest-to-vitest: Update codemod to handle `jest.setTimeout` calls ([#1439](https://github.com/seek-oss/sku/pull/1439))

## 1.0.0

### Major Changes

- Drop support for Node.js versions below 22.19.0 ([#1419](https://github.com/seek-oss/sku/pull/1419))

  BREAKING CHANGE:

  The minimum supported Node.js version is now 22.19.0. Consumers must upgrade to Node.js v22.19.0 or later.

- First major release marking stable support for this package ([#1418](https://github.com/seek-oss/sku/pull/1418))

- Throw error when given unsupported arguments. ([#1418](https://github.com/seek-oss/sku/pull/1418))
  This is now the default behaviour of the updated commander.js version.

  **BREAKING CHANGE**:

  Excess command-arguments will now cause an error.
  To fix this, remove any unsupported arguments provided to the command.

### Patch Changes

- Prevent async being appended to intentionally synchronous functions ([#1417](https://github.com/seek-oss/sku/pull/1417))

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
