# Vitest

[Vitest] is a testing framework that supports ESM out-of-the-box, integrates with the Vite ecosystem and has a similar API to Jest.
These features make it a great replacement for Jest in `sku` applications, especially given [Jest's current limitations with ESM].
Sku supports Vitest as an alternate to Jest since v15

**We recommend using vitest with the vite bundler and in an ESM project**, however these are not requirements.

## Migrating to Vitest

Migrating to Vitest should be fairly straightforward.
Before making any changes, it is highly recommend to read [the Vitest documentation](https://vitest.dev/guide/) to familiarise yourself with the API and features, as well as to better understand the differences between Jest and Vitest.

To enable Vitest in `sku`, first install the required dependencies:

```bash
pnpm add -D vitest
```

Then, configure [`testRunner`][test runner] in your `sku` config:

```typescript
// sku.config.ts
import type { SkuConfig } from 'sku';

export default {
  testRunner: 'vitest',
  ...
} satisfies SkuConfig;
```

`sku` will now invoke [the `vitest` CLI][Vitest CLI] instead of the `jest` CLI when running `sku test`.

#### Key differences between Vitest and Jest

Vitest has strong compatibility with the Jest API, however it still has differences that may affect your tests.
Differences that affect sku projects are listed here.
The full list is documented in the Vitest documentation: [Migrating from Jest to Vitest].

To automate most of the migration process, a codemod is available.
Note that additional changes may still be required after running this codemod.

```sh
pnpm dlx @sku-lib/codemod jest-to-vitest .
```

**Default Watch Mode**

`vitest` defaults to watch mode when running tests.
To run tests without watch mode you can use the `--run` flag:

```json
// package.json
{
  "scripts": {
    // ...
    "test": "sku test --run"
  }
}
```

Watch mode won't trigger in CI environments, so it's safe to omit the flag in your pipeline.

**Code Coverage Dependencies**

Vitest does not install code coverage dependencies by default.
To collect code coverage, pass the `--coverage` flag to the `sku test` command and install the `@vitest/coverage-v8` package:

```bash
pnpm add -D @vitest/coverage-v8
```

**Testing Library Matchers**

If your test setup file includes an import for `@testing-library/jest-dom`, you may need to change this to `@testing-library/jest-dom/vitest`:

```diff
// test-setup.ts
- import '@testing-library/jest-dom';
+ import '@testing-library/jest-dom/vitest';
```

**Globals Disabled**

Jest enables global APIs such as `it`, `describe`, `beforeAll`, etc., by default.
Vitest does not.
Sku adopts the Vitest defaults, meaning you will need to explicitly import these test functions.
This change results in a cleaner global namespace, better type safety, clearer dependencies and is more consistency with modern javascript practices.

```diff
+ import { describe, expect, it } from 'vitest';
```

Be aware that since globals are disabled, some common libraries like `testing-library` will not run auto DOM cleanup.
If using these libraries, you will need to add cleanup to your configured `setupTests` file.

```diff
import '@testing-library/jest-dom/vitest';

+ import { cleanup } from '@testing-library/react';
+ import { afterEach } from 'vitest';

+ afterEach(cleanup)
```

[Vitest]: https://vitest.dev/
[Jest's current limitations with ESM]: https://jestjs.io/docs/ecmascript-modules
[test runner]: ./docs/configuration.md#testrunner
[Vitest CLI]: https://vitest.dev/guide/cli.html
[codemod]: https://codemod.com/registry/jest-vitest
[Migrating from Jest to Vitest]: https://vitest.dev/guide/migration.html#jest
[Vitest globals]: https://vitest.dev/config/#globals
