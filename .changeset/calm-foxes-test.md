---
'sku': major
---

Remove Jest support. Vitest is now the only test runner.

**BREAKING CHANGE**

`sku test` always runs Vitest, for both the `vite` and `webpack` bundlers.
Install `vitest` in your app's `devDependencies` to run tests.

The following have been removed:

- The `testRunner` option. `testRunner: 'jest'` is now a config error. `testRunner: 'vitest'` logs a warning and can be removed.
- The `dangerouslySetJestConfig` option, which is now a config error. Use `dangerouslySetVitestConfig` instead.
- The `sku/jest-preset` export
- The Jest ESLint rules. sku always uses the Vitest ESLint rules.
- The `jest` types in the generated `tsconfig.json`

sku now depends on `jsdom` v31 directly for Vitest's `jsdom` test environment. Previously, apps got `jsdom` v26 through `jest-environment-jsdom`.

Follow the [Jest to Vitest migration guide](https://seek-oss.github.io/sku/vitest) to migrate your tests. It includes a codemod and a prompt for AI coding agents.
