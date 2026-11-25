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

:::: tip Migrating with an AI agent
Paste this prompt into your coding agent to have it run the migration for you:

```text
Migrate this sku app from Jest to Vitest by fetching and following the instructions at https://seek-oss.github.io/sku/prompts/migrate-to-vitest.md
```

If your agent can't access the web, copy the full prompt instead.

::: details View full prompt

<<< ../public/prompts/migrate-to-vitest.md{md}

:::
::::

Migrating to Vitest should be straightforward.
Before you make any changes, read [the Vitest documentation](https://vitest.dev/guide/).
That documentation covers the API, the features, and the differences between Jest and Vitest.

To enable Vitest in `sku`, first install the required dependencies:

```sh
pnpm add -D vitest
```

Vitest is the default [`testRunner`][test runner].
Then, remove `testRunner: 'jest'` from your `sku` config:

```ts
// sku.config.ts
import type { SkuConfig } from 'sku';

export default {
  testRunner: 'jest', // [!code --]
} satisfies SkuConfig;
```

`sku` then invokes [the `vitest` CLI][Vitest CLI] instead of the `jest` CLI when you run `sku test`.

### Key differences between Vitest and Jest

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

The codemod also changes tests that do not run with Vitest, such as Cypress or Mocha tests.
Revert the changes to those files.

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

**JSX in `.js` Files**

Vitest does not parse JSX in `.js` files.
Rename test files that contain JSX to `.jsx`, along with their snapshot files.

**Snapshot Format**

Vitest's snapshot format differs from Jest's.
Regenerate your snapshots after migrating, and check that the diff only contains formatting changes:

```sh
pnpm sku test --run -u
```

```diff
// __snapshots__/Button.test.tsx.snap
- exports[`Button renders 1`] = `
+ exports[`Button > renders 1`] = `
```

**Mock Factories**

Vitest hoists `vi.mock` calls above the imports in a test file, so mock factories cannot use imports or variables from the test file.
Replace `require` calls in mock factories with `vi.importActual`:

<!-- eslint-skip -->

```ts
import type * as React from 'react'; // [!code ++]

vi.mock('./Map', () => { // [!code --]
  const { createElement } = require('react'); // [!code --]
vi.mock('./Map', async () => { // [!code ++]
  const { createElement } = await vi.importActual<typeof React>('react'); // [!code ++]
  return { Map: () => createElement('div', null, 'Map') };
});
```

Declare mocks that factories use with [`vi.hoisted`][vi.hoisted]:

```ts
import type * as Router from 'react-router';

const { mockNavigate } = vi.hoisted(() => ({ mockNavigate: vi.fn() }));

vi.mock('react-router', async () => ({
  ...(await vi.importActual<typeof Router>('react-router')),
  useNavigate: () => mockNavigate,
}));
```

**Timer Functions Without Fake Timers**

Timer functions such as `vi.advanceTimersByTime` throw an error unless fake timers are enabled with `vi.useFakeTimers()`.
Jest only logged a warning.

**Typing Mocks**

Use a partial mock instead of casting a mocked return value:

```ts
vi.mocked(useUser).mockReturnValue({ name: 'Jane' } as unknown as User); // [!code --]
vi.mocked(useUser, { partial: true }).mockReturnValue({ name: 'Jane' }); // [!code ++]
```

**Linting**

The `vitest/expect-expect` lint rule is an error rather than a warning.
If your tests assert through helper functions, list them in `assertFunctionNames` with [`dangerouslySetESLintConfig`]:

```ts
// sku.config.ts
export default {
  dangerouslySetESLintConfig: (skuEslintConfig) => [
    ...skuEslintConfig,
    {
      rules: {
        'vitest/expect-expect': [
          'error',
          { assertFunctionNames: ['expect', 'expectRedirect'] },
        ],
      },
    },
  ],
} satisfies SkuConfig;
```

### Removing Jest

When nothing references Jest anymore, remove Jest dependencies such as `jest` and `@types/jest`, Jest config files, and [`dangerouslySetJestConfig`] from your `sku` config.

### Migrating to ESM

Because of [Jest's current limitations with ESM], projects often migrate to ESM when they migrate to Vitest.
See [Migrating to ESM] for the steps.

[Vitest]: https://vitest.dev/
[Jest's current limitations with ESM]: https://jestjs.io/docs/ecmascript-modules
[test runner]: ./configuration.md#testrunner
[Vitest CLI]: https://vitest.dev/guide/cli.html
[codemod]: https://codemod.com/registry/jest-vitest
[Migrating from Jest to Vitest]: https://vitest.dev/guide/migration.html#jest
[Vitest globals]: https://vitest.dev/config/#globals
[vi.hoisted]: https://vitest.dev/api/vi.html#vi-hoisted
[`dangerouslySetESLintConfig`]: ./configuration.md#dangerouslyseteslintconfig
[`dangerouslySetJestConfig`]: ./configuration.md#dangerouslysetjestconfig
[Migrating to ESM]: ./vite.md#migrating-to-esm
