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

## Caching

`sku` emits two different caches that can help speed up local and production builds.

### [Webpack filesystem cache]

This cache stores generated webpack modules and chunks.
It is only emitted during local development.
Its purpose is to reduce the time it takes to start the local development server.
`sku` enables this cache by default, but it can be disabled via the [`persistentCache` configuration].

> This cache is stored in `node_modules/.cache/webpack` and can be safely deleted at any time.

[webpack filesystem cache]: https://webpack.js.org/configuration/cache/#cachetype
[`persistentCache` configuration]: ./docs/configuration#persistentcache

### [`babel-loader` cache]

This cache stores the result of module transpilation performed by `babel-loader`.
It is emitted during both local development and production builds.
Its purpose is to speed up transpilation of TypeScript/JavaScript code.
This can benefit both local develpoment (when the webpack cache is invalidated) and production builds.
For applications with a large number of source files and/or dependencies, this cache can significantly reduce build times.

> This cache is stored in `node_modules/.cache/babel-loader` and can be safely deleted at any time.

[`babel-loader` cache]: https://github.com/babel/babel-loader?tab=readme-ov-file#options

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

By default, sku will remove assertions in your production builds with [`babel-plugin-unassert`].
This allows you to perform more expensive checks during development without worrying about the perfomance impacts on users.

For example, given the following code:

```tsx
import React from 'react';
import assert from 'assert';

export const Rating = ({ rating }: { rating: number }) => {
  assert(rating >= 0 && rating <= 5, 'Rating must be between 0 and 5');

  return <div>...</div>;
};
```

In production, sku would transform the code above into code roughly equivalent to:

```js
import React from 'react';

export const Rating = ({ rating }) => <div>...</div>;
```

[`babel-plugin-unassert`]: https://github.com/unassert-js/babel-plugin-unassert

### Supported Assertion Function Names

- `invariant`
- `assert`

### Supported Assertion Libraries

- [`tiny-invariant`] (Recommended)
- `assert` ([Node.js built-in] or [browser port])
- `node:assert` ([Node.js built-in])

Any combination of function name and library name is supported.
[`tiny-invariant`] is recommended over [`assert`][browser port] due to its simplicity and size.

[`tiny-invariant`]: https://www.npmjs.com/package/tiny-invariant
[Node.js built-in]: https://nodejs.org/api/assert.html
[browser port]: https://www.npmjs.com/package/assert

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
