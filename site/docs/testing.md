# Unit and Snapshot Testing

via [Jest](https://facebook.github.io/jest/)

The `sku test` command will invoke Jest, running any tests in files named `*.test.js`, `*.spec.js` or in a `__tests__` folder.

Since sku uses Jest as a testing framework, you can read the [Jest documentation](https://facebook.github.io/jest/) for more information on writing compatible tests.

Note: `sku` will forward all command line args to `jest`.

Example running tests in watch mode:

```sh
$ sku test --watch
```

If you need to set up your test framework, you can provide a `setupTests` script in your config:

```ts
export default {
  setupTests: 'src/setupTests.ts',
} satisfies SkuConfig;
```

For example, if you're using [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/) and wish to use the custom jest matchers provided by [`@testing-library/jest-dom`](https://github.com/testing-library/jest-dom), your `setupTests` script would look like this:

```ts
import '@testing-library/jest-dom';
```

sku's Jest configuration can also be used as a [preset](https://jestjs.io/docs/configuration#preset-string):

```js
/** @type {import('jest').Config} */
module.exports = {
  preset: 'sku',
};
```

This enables debugging tests in VS Code using the [Jest extension](https://marketplace.visualstudio.com/items?itemName=Orta.vscode-jest), by following the instructions in the [Jest documentation](https://jestjs.io/docs/en/troubleshooting#debugging-in-vs-code).
