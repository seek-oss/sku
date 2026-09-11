# Unit and Snapshot Testing

via [Jest](https://facebook.github.io/jest/)

The `sku test` command invokes Jest.
Jest runs tests in files named `*.test.js`, `*.spec.js`, or in a `__tests__` folder.

sku uses Jest as a testing framework.
Read the [Jest documentation](https://facebook.github.io/jest/) for more information on writing compatible tests.

> [!NOTE]
> `sku` forwards all command line args to `jest`.

Example running tests in watch mode:

```sh
$ sku test --watch
```

If you need to configure your test framework, provide a `setupTests` script in your config:

```ts
export default {
  setupTests: 'src/setupTests.ts',
} satisfies SkuConfig;
```

For example, if you use [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/) and want the custom jest matchers from [`@testing-library/jest-dom`](https://github.com/testing-library/jest-dom), your `setupTests` script looks like this:

```ts
import '@testing-library/jest-dom';
```

You can also use sku's Jest configuration as a [preset](https://jestjs.io/docs/configuration#preset-string):

```js
/** @type {import('jest').Config} */
module.exports = {
  preset: 'sku',
};
```

This lets you debug tests in VS Code with the [Jest extension](https://marketplace.visualstudio.com/items?itemName=Orta.vscode-jest).
Follow the instructions in the [Jest documentation](https://jestjs.io/docs/en/troubleshooting#debugging-in-vs-code).
