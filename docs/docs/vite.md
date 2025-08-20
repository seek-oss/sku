# Vite

!> Support for [Vite] as an alternative bundler for `sku` is available as an experimental feature.
It is currently being trialled internally and is not ready for general production use.
If you wish to try it out, please reach out in [`#sku-support`].

[Vite]: https://vite.dev/
[`#sku-support`]: https://seek.enterprise.slack.com/archives/CDL5VP5NU

## Limitations

Vite support is currently only available for [static applications (SSG)][SSG].
Support for [server-rendered applications (SSR)][SSR] is planned for the future.

Practically, this means that currently only [`sku start`] and [`sku build`] are supported with Vite.
[`sku serve`] is also available as it is bundler agnostic.

[`sku start`]: ./docs/CLI.md#start
[`sku build`]: ./docs/CLI.md#build
[`sku serve`]: ./docs/CLI.md#serve

### Planned deprecation of library mode

Building [libraries] with webpack is currently supported by `sku`.
However, this feature is planned for deprecation and will not be supported with Vite.
A migration guide for `sku` libraries will be provided in the future once the deprecation is finalised.

[SSG]: ./docs/static-rendering.md
[SSR]: ./docs/server-rendering.md
[libraries]: ./docs/libraries.md

## Prerequisites

!> Before making any changes to your application, please ensure you have read this document in its entirety.

### Migrating to ESM

Vite applications must be written in [ESM (ECMAScript Modules)][ESM].
**_Before swapping to Vite_**, you must ensure the Node.js package containing your application declares itself as an ES module.
Additionally, any application code must use ESM syntax for importing and exporting modules.

#### Declaring an ES module

Declaring your package as an ES module involves adding `"type": "module"` to your `package.json` file:

```diff
{
  "name": "my-sku-app",
+ "type": "module",
  "scripts": {
    "start": "sku start",
    "build": "sku build"
  },
  ...
}
```

While this change may seem small, it has a significant impact on how Node.js and TypeScript interpret your code: it signals to Node.js and TypeScript that **any code written in `.js` or `.ts` files should be treated as ESM**.

You may have non-application code such as Node.js scripts or configuration files that will also be affected by this change.
If these files contain [CommonJS] syntax and you do not wish to convert them to ESM, you can keep them as CommonJS by using the `.cjs` or `.cts` file extensions.
However, **it is highly recommended to convert all code to ESM if possible**.

#### ESM syntax

Most application code at SEEK is written in ESM syntax, so it's likely unnecessary to make many changes to your codebase.
However, if you _do_ need to convert some code to ESM, the primary change will be to ensure you are using the correct import syntax.

In ESM, modules are imported using the `import` keyword and exported using the `export` keyword:

```diff
// named imports
-const { foo } = require('foo');
+import { foo } from 'foo';

// default imports
-const express = require('express');
+import express from 'express';

// named exports
-const SOME_CONSTANT = 'some value';
-module.exports = { SOME_CONSTANT };
+export const SOME_CONSTANT = 'some value';

// default exports
const ANOTHER_CONSTANT = '123';
-module.exports = ANOTHER_CONSTANT;
+export default ANOTHER_CONSTANT;
```

#### Import path file extensions

Typically, [ESM resolution dictates][explicit file extensions] that relative and absolute import specifiers must include a file extension, and that directory indexes (`index.js` files) must also be fully specified.

However, Vite can resolve these imports for you, so it is only necessary to include file extensions in import paths within non-application code.

?> By default, `sku` configures `allowImportingTsExtensions: true` in your `tsconfig.json` file.
In situations where an explicit file extension is required, such as in a Node.js script, this setting allows you to import TypeScript files with a `.ts` extension instead of a `.js` extension, which can be a source of confusion for those new to ESM codebases.

[ESM]: https://nodejs.org/api/esm.html
[CommonJS]: https://nodejs.org/api/modules.html
[explicit file extensions]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/import#:~:text=you%20cannot%20omit%20the%20file%20extension%20or%20the%20index.js%20file%20name.%20

### Migrating to Vitest

[Vitest] is a testing framework that supports ESM out-of-the-box, integrates with the Vite ecosystem and has a similar API to Jest.
These features make it a great replacement for Jest in `sku` applications, especially given [Jest's current limitations with ESM].

?> Due to these limitations, it's likely that you'll need to migrate to Vitest at the same time as migrating to ESM.

Migrating to Vitest should be fairly straightforward.
Before making any changes, it is highly recommend to read [the Vitest documentation](https://vitest.dev/guide/) to familiarise yourself with the API and features, as well as to better understand the differences between Jest and Vitest.

To configure `sku` to use Vitest instead of Jest when running `sku test`, configure `__UNSAFE_EXPERIMENTAL__testRunner` in your `sku` config:

```typescript
// sku.config.ts
import type { SkuConfig } from 'sku';

export default {
  __UNSAFE_EXPERIMENTAL__testRunner: 'vitest',
  ...
} satisfies SkuConfig;
```

With this change, `sku` will now invoke [the `vitest` CLI][Vitest CLI] instead the `jest` CLI when running `sku test`.

?> A key difference between the `jest` and `vitest` CLIs is that `vitest` defaults to watch mode when running tests locally.
To force run (non-watch) mode, you can use `sku test --run`.

Your tests are unlikely to work immediately as there are some differences between Jest and Vitest that may need addressing.
The [Jest -> Vitest][codemod] can fix some of these differences automatically:

```sh
pnpm dlx codemod jest/vitest
```

After running the codemod, manual changes may still be necessary.
These differences are documented in [Migrating from Jest to Vitest].

?> By default `sku` enables [Vitest globals] such as `describe`, `it`, and `expect` in your tests.
This aligns with the Jest API and allows you to write tests without needing to import these functions.

[Vitest]: https://vitest.dev/
[Jest's current limitations with ESM]: https://jestjs.io/docs/ecmascript-modules
[Vitest CLI]: https://vitest.dev/guide/cli.html
[codemod]: https://codemod.com/registry/jest-vitest
[Migrating from Jest to Vitest]: https://vitest.dev/guide/migration.html#jest
[Vitest globals]: https://vitest.dev/config/#globals

## Migrating to Vite

To configure `sku` to bundle your applications with Vite, configure `__UNSAFE_EXPERIMENTAL__bundler` in your `sku` config:

```typescript
// sku.config.ts
import type { SkuConfig } from 'sku';

export default {
  __UNSAFE_EXPERIMENTAL__bundler: 'vite',
  ...
} satisfies SkuConfig;
```

Additionally, the `--experimental-bundler` flag must be passed to `sku` CLI commands to enable Vite:

```bash
sku start --experimental-bundler
```

Depending on your application, you may need no further changes to your codebase after this point in order to run your application with Vite.
However, if there are issues with your application, you may need to make some changes to your codebase.

Documented below is a list of differences between `sku` with `webpack` and `sku` with Vite.

?> If you encounter issues during migration that aren't listed below, please reach out in [`#sku-support`] so we can update this document.

[`#sku-support`]: https://seek.enterprise.slack.com/archives/CDL5VP5NU

### Code splitting

Routes and components that take advantage of `sku`'s [code splitting] API will need to update imports from `sku/@loadable/component` to `sku/vite/loadable`.
A codemod is available to help with this migration:

```bash
pnpm dlx @sku-lib/codemod transform-vite-loadable .
```

The new `sku/vite/loadable` entrypoint relies on React's [`<Suspense />`][suspense] component to load a fallback state.
You can wrap a `loadable` component in a `<Suspense />` component or provide a `fallback` option to the `loadable` function which will wrap it inside a `<Suspense />` component for you:

```tsx
import { Suspense } from 'react';
import { loadable } from 'sku/vite/loadable';

const Home = loadable(() => import('./Home'), {
  fallback: <div>Loading Home...</div>,
});

export default () => (
  <div>
    <Home />
  </div>
);
```

Note that in order to use `loadable` with a `fallback`, your application must use the `renderToStringAsync` API.
See the [supporting react suspense] documentation for more information.

[Code splitting]: ./docs/code-splitting.md
[suspense]: https://react.dev/reference/react/Suspense
[supporting react suspense]: ./docs/static-rendering.md#supporting-react-suspense

### Dev server middleware

The Vite dev server uses [`Connect`](https://github.com/senchalabs/connect) as its server framework, as opposed to `webpack` which uses [`Express`](https://expressjs.com/).
As a result, the middleware API has changed - the middleware function now receives a `Connect.Server` instance that can be used to add middleware to the dev server.

Middleware can be added to the dev server via the [`use`] method on the server instance:

```javascript
// devMiddleware.js
export default function (server) {
  server.use((req, res, next) => {
    // your middleware logic
    next();
  });

  // or use a path
  server.use('/api', (req, res, next) => {
    // your middleware logic
    next();
  });
}
```

?> Currently only JavaScript middleware is supported.
Support for TypeScript middleware will be added in the near future.

[`use`]: https://github.com/senchalabs/connect#use-middleware

### Vite client types

If you require [types for Vite's client-side APIs], such as [`import.meta.glob`], create a `.d.ts` file in your codebase:

```typescript
/// <reference types="sku/vite/client" />
```

[types for Vite's client-side APIs]: https://vite.dev/guide/features#client-types
[`import.meta.glob`]: https://vite.dev/guide/features.html#glob-import
