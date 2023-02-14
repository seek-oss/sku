# Unit and Snapshot Testing

via [Jest](https://facebook.github.io/jest/)

The `sku test` command will invoke Jest, running any tests in files named `*.test.js`, `*.spec.js` or in a `__tests__` folder.

Since sku uses Jest as a testing framework, you can read the [Jest documentation](https://facebook.github.io/jest/) for more information on writing compatible tests.

Note: `sku` will forward all command line args to `jest`.

Example running tests in watch mode:

```bash
$ sku test --watch
```

If you need to set up your test framework, you can provide a `setupTests` script in your config:

```js
module.exports = {
  setupTests: 'src/setupTests.js',
};
```

For example, if you're using [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/) and wish to use the custom jest matchers provided by [`@testing-library/jest-dom`](https://github.com/testing-library/jest-dom), your `setupTests` script would look like this:

```js
import '@testing-library/jest-dom';
```
