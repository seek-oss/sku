# Build features

## Images

The following images types are supported in sku:
`bmp`, `gif`, `jpeg`, `png` and `svg`.

If you want to use a currently unsupported format feel free to submit a PR or contact #sku-support.

## Source maps

Source maps are enabled by default when running the `sku start` command.
However, if you want to generate source maps when running `sku build`, you can do so by enabling [`sourceMapsProd`](./docs/configuration#sourcemapsprod).

## Compile packages

Sometimes you might want to extract and share code between sku projects, but this code is likely to rely on the same tooling and language features that sku provides.
sku supports loading packages as if they were part of your app via the `compilePackages` feature.

The best way to configure a package as a `compilePackage` is to set `"skuCompilePackage": true` in the **package's** `package.json`.
This method only works for `@seek` scoped packages.

```json
{
  "name": "@seek/my-package",
  "skuCompilePackage": true
}
```

Alternatively, you can add any packages you like to the `compilePackages` option in the **consuming app's** sku config file.

```ts
export default {
  compilePackages: ['awesome-shared-components'],
} satisfies SkuConfig;
```

Any `node_modules` marked as a `compilePackage` will be compiled through webpack as if they are part of your app.

## Polyfills

Since sku injects its own code into your bundle in development mode, it's important for polyfills that modify the global environment to be loaded before all other code. To address this, the `polyfills` option allows you to provide an array of modules to import before any other code is executed.

_**NOTE:** Polyfills are only loaded in a browser context. This feature can't be used to modify the global environment in Node._

```ts
export default {
  polyfills: [
    'promise-polyfill',
    'core-js/modules/es6.symbol',
    'regenerator-runtime/runtime',
  ],
} satisfies SkuConfig;
```

## Bundle analysis

`sku` comes with bundle analysis built in via [webpack-bundle-analyzer](https://www.npmjs.com/package/webpack-bundle-analyzer).
A report is generated in the `/report` directory when `sku build` is run.

## Pre-commit hook

To speed up the feedback loop on linting and formatting errors, `sku` provides a `pre-commit` script that can be run to catch simple problems before CI.
To make use of this hook, it's recommended to install [husky](https://www.npmjs.com/package/husky) as a development dependency and configure it as follows:

```json
// package.json

{
  "scripts": {
    "prepare": "husky"
  }
}
```

```sh
echo "yarn sku pre-commit" > .husky/pre-commit
```

For more details on configuring hooks, please see husky's [documentation](https://typicode.github.io/husky/#create-a-hook).

## Assertion removal

If you use [Node's `assert` library](https://nodejs.org/api/assert.html) or its [browser port](https://www.npmjs.com/package/assert), your assertions will be automatically removed in production via [`babel-plugin-unassert`](https://github.com/unassert-js/babel-plugin-unassert).
This allows you to perform more expensive checks during development without worrying about the perfomance impacts on users.

For example, let's assume you wrote the following code:

```tsx
import React from 'react';
import assert from 'assert';

export const Rating = ({ rating }: { rating: number }) => {
  assert(rating >= 0 && rating <= 5, 'Rating must be between 0 and 5');

  return <div>...</div>;
};
```

In production, the code above would be logically equivalent to this:

```js
import React from 'react';

export const Rating = ({ rating }) => <div>...</div>;
```

## DevServer Middleware

Supply a `devServerMiddleware` path in your sku config to access the internal dev [Express] server.

The file must export a function that will receive the express server.

Example:

```js
module.exports = (app) => {
  app.get('/mock-api', (req, res) => {
    // ...
  });
};
```

[express]: http://expressjs.com/
