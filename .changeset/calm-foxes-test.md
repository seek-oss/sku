---
'sku': major
---

Remove Jest support. Vitest is now the only test runner.

**BREAKING CHANGE**

`sku test` always runs Vitest, for both the `vite` and `webpack` bundlers.
Install `vitest` in your app's `devDependencies` to run tests.

The following have been removed:

- The `testRunner` option.
- The `dangerouslySetJestConfig` option. Use `dangerouslySetVitestConfig` instead.
- The `sku/jest-preset` export.
- The Jest ESLint rules. sku always uses the Vitest ESLint rules.
- The `jest` types in the generated `tsconfig.json`.

Follow the [Jest to Vitest migration guide](https://seek-oss.github.io/sku/vitest) to migrate your tests. It includes a codemod and a prompt for AI coding agents.
