# Build features

## Images

The following images types are supported in sku:
`bmp`, `gif`, `jpeg`, `png` and `svg`.

If you want to use a currently unsupported format feel free to submit a PR or contact #sku-support.

## Source maps

Source maps are enabled by default when running the `sku start` command. However, if you want to generate source maps when running `sku build`, you can do so by enabling [`sourceMapsProd`](./docs/configuration#sourcemapsprod).

## Compile packages

Sometimes you might want to extract and share code between sku projects, but this code is likely to rely on the same tooling and language features that this toolkit provides. A great example of this is [seek-style-guide](https://github.com/seek-oss/seek-style-guide). Out of the box sku supports loading the seek-style-guide but if you need to treat other packages in this way you can use `compilePackages`.

```js
module.exports = {
  compilePackages: ['awesome-shared-components'],
};
```

Any `node_modules` passed into this option will be compiled through webpack as if they are part of your app.

## Polyfills

Since sku injects its own code into your bundle in development mode, it's important for polyfills that modify the global environment to be loaded before all other code. To address this, the `polyfills` option allows you to provide an array of modules to import before any other code is executed.

_**NOTE:** Polyfills are only loaded in a browser context. This feature can't be used to modify the global environment in Node._

```js
module.exports = {
  ...,
  polyfills: [
    'promise-polyfill',
    'core-js/modules/es6.symbol',
    'regenerator-runtime/runtime'
  ]
}
```

## Bundle analysis

`sku` comes with bundle analysis built in via [webpack-bundle-analyzer](https://www.npmjs.com/package/webpack-bundle-analyzer). A report is generated in the `/report` directory when `sku build` is run.

## Pre-commit hooks

To speed up the feedback loop on linting and formatting errors, `sku` provides a `pre-commit` script that can be run to catch simple problems before CI. To make use of this, it's recommended that you install [husky](https://www.npmjs.com/package/husky) as a development dependency and configure it in `package.json` as follows:

```js
// package.json

"husky": {
  "hooks": {
    "pre-commit": "sku pre-commit"
  }
},
```

## Assertion removal

If you use [Node's `assert` library](https://nodejs.org/api/assert.html) or its [browser port](https://www.npmjs.com/package/assert), your assertions will be automatically removed in production via [`babel-plugin-unassert`](https://github.com/unassert-js/babel-plugin-unassert). This allows you to perform more expensive checks during development without worrying about the perfomance impacts on users.

For example, let's assume you wrote the following code:

```js
import React from 'react';
import assert from 'assert';

export const Rating = ({ rating }) => {
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

Place a `dev-middleware.js` file in the root of the project. The file must export a function that will receive the express server.

This can be used to expose the Webpack DevServer's Express server.

Example:

```js
module.exports = app => {
  app.get('/mock-api', (req, res) => {
    ...
  })
}
```
