# Vitest

[Vitest] is a testing framework.
It supports ESM without extra configuration.
It integrates with the Vite ecosystem.
It has a similar API to Jest.

These features make Vitest a replacement for Jest in `sku` applications, especially given [Jest's current limitations with ESM].
Sku supports Vitest as an alternative to Jest since v15.

**We recommend using vitest with the vite bundler and in an ESM project.**
These are not requirements.

## Migrating to Vitest

Migrating to Vitest should be straightforward.
Before you make any changes, read [the Vitest documentation](https://vitest.dev/guide/).
That documentation covers the API, the features, and the differences between Jest and Vitest.

To enable Vitest in `sku`, first install the required dependencies:

```sh
pnpm add -D vitest
```

Then, configure [`testRunner`][test runner] in your `sku` config:

```ts
// sku.config.ts
import type { SkuConfig } from 'sku';

export default {
  testRunner: 'vitest', // [!code ++]
  ...
} satisfies SkuConfig;
```

`sku` then invokes [the `vitest` CLI][Vitest CLI] instead of the `jest` CLI when you run `sku test`.

#### Key differences between Vitest and Jest

Vitest has strong compatibility with the Jest API.
It still has differences that may affect your tests.
This page lists the differences that affect sku projects.
The Vitest documentation has the full list: [Migrating from Jest to Vitest].

To automate most of the migration process, a codemod is available.

> [!NOTE]
> Additional changes may still be required after running this codemod.

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

Watch mode does not start in CI environments, so you can omit the flag in your pipeline.

**Code Coverage Dependencies**

Vitest does not install code coverage dependencies by default.
To collect code coverage, pass the `--coverage` flag to the `sku test` command.
Install the `@vitest/coverage-v8` package:

```sh
pnpm add -D @vitest/coverage-v8
```

**Testing Library Matchers**

If your test setup file includes an import for `@testing-library/jest-dom`, you may need to change this to `@testing-library/jest-dom/vitest`:

```ts
// test-setup.ts
import '@testing-library/jest-dom'; // [!code --]
import '@testing-library/jest-dom/vitest'; // [!code ++]
```

**Globals Disabled**

Jest enables global APIs such as `it`, `describe`, `beforeAll`, etc., by default.
Vitest does not.
Sku adopts the Vitest defaults.
You need to import these test functions explicitly.

```ts
// myFunction.test.ts
import { describe, expect, it } from 'vitest'; // [!code ++]
```

Because Vitest disables globals, some common libraries like `testing-library` will not run auto DOM cleanup.
If you use these libraries, add cleanup to your configured `setupTests` file.

```ts
import '@testing-library/jest-dom/vitest';

import { cleanup } from '@testing-library/react'; // [!code ++]
import { afterEach } from 'vitest'; // [!code ++]

afterEach(cleanup); // [!code ++]
```

[Vitest]: https://vitest.dev/
[Jest's current limitations with ESM]: https://jestjs.io/docs/ecmascript-modules
[test runner]: ./configuration.md#testrunner
[Vitest CLI]: https://vitest.dev/guide/cli.html
[codemod]: https://codemod.com/registry/jest-vitest
[Migrating from Jest to Vitest]: https://vitest.dev/guide/migration.html#jest
[Vitest globals]: https://vitest.dev/config/#globals
