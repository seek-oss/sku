# Unit and Snapshot Testing

via [Vitest](https://vitest.dev/)

The `sku test` command invokes Vitest.
Vitest runs tests in files named `*.test.*` or `*.spec.*`, for example `App.test.tsx`.

Vitest has a similar API to Jest.
Read the [Vitest documentation](https://vitest.dev/guide/) for more information on writing compatible tests.

If you are migrating an app from Jest, follow the [Jest to Vitest migration guide](./vitest.md).

> [!NOTE]
> `sku` forwards all command line args to `vitest`.
> See the [Vitest CLI documentation](https://vitest.dev/guide/cli.html) for the available options.

Install `vitest` in your project's `devDependencies`:

```sh
pnpm add -D vitest
```

Sku runs tests through its Vite configuration in a `jsdom` environment, for both the `vite` and `webpack` [bundlers](./configuration.md#bundler).

## Watch mode

Vitest starts in watch mode by default.
To run the tests once, pass the `--run` flag:

```json
// package.json
{
  "scripts": {
    "test": "sku test --run"
  }
}
```

Watch mode does not start in CI environments.

## Test globals

Vitest test APIs such as `describe`, `it` and `expect` are not globals.
Import them explicitly:

```ts
// myFunction.test.ts
import { describe, expect, it } from 'vitest';

import { myFunction } from './myFunction';

describe('myFunction', () => {
  it('returns true', () => {
    expect(myFunction()).toBe(true);
  });
});
```

## Setting up tests

If you need to configure your test framework, provide a [`setupTests`](./configuration.md#setuptests) script in your config:

```ts
export default {
  setupTests: 'src/setupTests.ts',
} satisfies SkuConfig;
```

For example, if you use [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/) and want the custom matchers from [`@testing-library/jest-dom`](https://github.com/testing-library/jest-dom), your `setupTests` script looks like this.
Because test globals are disabled, React Testing Library cannot clean up the DOM automatically, so add the cleanup yourself:

```ts
import '@testing-library/jest-dom/vitest';

import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';

afterEach(cleanup);
```

## Code coverage

To collect code coverage, install `@vitest/coverage-v8` and pass the `--coverage` flag:

```sh
pnpm add -D @vitest/coverage-v8
pnpm sku test --run --coverage
```

## Customising Vitest

To change sku's Vitest configuration, use [`dangerouslySetVitestConfig`](./configuration.md#dangerouslysetvitestconfig).
