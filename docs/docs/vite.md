# Vite

?> Support for [Vite] as an alternative bundler for `sku` is available as an experimental feature.
It is currently being trialled internally and is not ready for general production use.
If you wish to try it out, please reach out in [`#sku-support`].

[Vite]: https://vite.dev/
[`#sku-support`]: https://seek.enterprise.slack.com/archives/CDL5VP5NU

## Limitations

Vite support is currently only available for [static applications (SSG)][SSG].
This means that only [`sku start`] and [`sku build`] are supported.
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

There are two critical prerequisites for migrating to Vite:

1. [Applications must be written in ESM][Migrating to ESM]
2. [Applications must use Vitest for running tests][Migrating to Vitest]

Given [Jest's current limitations with ESM], it is highly likely that both these prerequisites will need to be implemented at the same time.

**It is highly recommended to implement, test and release these changes independently from the changes necessary to [migrate to Vite][Migrating to Vite].**

[Migrating to ESM]: #migrating-to-esm
[Migrating to Vitest]: #migrating-to-vitest
[Migrating to Vite]: #migrating-to-vite

### Migrating to ESM

Migrating to ESM involves two steps:

1. [Ensure your application declares itself as an ES module][Declaring an ES module]
1. [Ensure all application code uses ESM syntax for importing and exporting modules][ESM syntax]

[Declaring an ES module]: #declaring-an-es-module
[ESM syntax]: #esm-syntax

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

While this change may seem small, it has a significant impact on how Node.js and TypeScript interpret your code: it signals that **any code written in `.js` or `.ts` files should be treated as ESM**.

You may have non-application code such as Node.js scripts or configuration files that will also be affected by this change.
If these files contain [CommonJS (CJS)][CommonJS] syntax and you do not wish to convert them to ESM, you can keep them as CommonJS by using the `.cjs` or `.cts` file extensions.
However, **it is highly recommended to convert all code to ESM if possible**.

#### Finding ESM code changes

After changing the repo to `type: module`, the [eslint-cjs-to-esm](https://github.com/azu/eslint-cjs-to-esm) package can be used to check for potential ESM code changes needed:

```bash
npx eslint-cjs-to-esm "./src/**/*.{js,ts}" --rule "node/file-extension-in-import: off, file-extension-in-import-ts/file-extension-in-import-ts: off, import/extensions: off"
```

The following sections detail changes that may be required.

#### ESM syntax

Most application code at SEEK is already written using ESM syntax, so it's unlikely you'll need to make many changes to your application.
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
**Due to these limitations, it's likely that you'll need to migrate to Vitest at the same time as migrating to ESM.**

Migrating to Vitest should be fairly straightforward.
Before making any changes, it is highly recommend to read [the Vitest documentation](https://vitest.dev/guide/) to familiarise yourself with the API and features, as well as to better understand the differences between Jest and Vitest.

To enable Vitest in `sku`, first install the required dependencies:

```bash
pnpm add -D vitest @sku-lib/vitest
```

Then, configure [`__UNSAFE_EXPERIMENTAL__testRunner`][test runner] in your `sku` config:

```typescript
// sku.config.ts
import type { SkuConfig } from 'sku';

export default {
  __UNSAFE_EXPERIMENTAL__testRunner: 'vitest',
  ...
} satisfies SkuConfig;
```

`sku` will now invoke [the `vitest` CLI][Vitest CLI] instead of the `jest` CLI when running `sku test`.

#### Key differences between Vitest and Jest

Vitest has strong compatibility with the Jest API, however it still has differences that may affect your tests.
Differences that affect sku projects are listed here.
The full list is documented in the Vitest documentation: [Migrating from Jest to Vitest].

To automate most of the migration process, a codemod is available.
Note that additional changes may still be required after running this codemod.

```sh
pnpm dlx @sku-lib/codemod jest-to-vitest .
```

**Default watch mode**

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

Watch mode won't trigger in CI environments, so it's safe to omit the flag in your pipeline.

**Globals disabled**

Jest enables global APIs such as `it`, `describe`, `beforeAll`, etc., by default.
Vitest does not.
Sku adopts the Vitest defaults, meaning you will need to explicitly import these test functions.
This change results in a cleaner global namespace, better type safety, clearer dependencies and is more consistency with modern javascript practices.

```diff
+ import { describe, expect, it } from 'vitest';
```

Be aware that since globals are disabled, some common libraries like `testing-library` will not run auto DOM cleanup.
If using these libraries, you will need to add cleanup to your configured `setupTests` file.

```diff
import '@testing-library/jest-dom';

+ import { cleanup } from '@testing-library/react';
+ import { afterEach } from 'vitest';

+ afterEach(cleanup)
```

[Vitest]: https://vitest.dev/
[Jest's current limitations with ESM]: https://jestjs.io/docs/ecmascript-modules
[test runner]: ./docs/configuration.md#__unsafe_experimental__testrunner
[Vitest CLI]: https://vitest.dev/guide/cli.html
[codemod]: https://codemod.com/registry/jest-vitest
[Migrating from Jest to Vitest]: https://vitest.dev/guide/migration.html#jest
[Vitest globals]: https://vitest.dev/config/#globals

## Migrating to Vite

To configure `sku` to bundle your applications with Vite, configure [`__UNSAFE_EXPERIMENTAL__bundler`][bundler] in your `sku` config:

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

[bundler]: ./docs/configuration.md#__unsafe_experimental__bundler
[`#sku-support`]: https://seek.enterprise.slack.com/archives/CDL5VP5NU

### Code splitting

Routes and components that take advantage of `sku`'s [code splitting] API will need to update imports from `sku/@loadable/component` to `@sku-lib/vite/loadable`.
A codemod is available to help with this migration:

```bash
pnpm dlx @sku-lib/codemod transform-vite-loadable .
```

You will also need to install a separate library that provides Vite-compatible loadable APIs:

```bash
pnpm add @sku-lib/vite/loadable
```

`@sku-lib/vite/loadable` relies on React's [`<Suspense />`][suspense] component to load a fallback state.
You can wrap a `loadable` component in a `<Suspense />` component or provide a `fallback` option to the `loadable` function which will wrap it inside a `<Suspense />` component for you:

```tsx
import { Suspense } from 'react';
import { loadable } from '@sku-lib/vite/loadable';

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

[`use`]: https://github.com/senchalabs/connect#use-middleware

### CJS named imports

Importing named exports from CJS dependencies may result in an error:

```
SyntaxError: [vite] Named export 'someFunction' not found. The requested module 'someDependency' is a CommonJS module, which may not support all module.exports as named exports.
CommonJS modules can always be imported via the default export, for example using:

import pkg from 'someDependency';
const {someFunction} = pkg;
```

There are a few options to resolve this issue:

- Replace the dependency with native APIs
- Upgrade the dependency to a version that supports ESM
- Replace the dependency with an alternative that supports ESM

Failing those solutions, `sku` provides a [`__UNSAFE_EXPERIMENTAL__cjsInteropDependencies`][cjs interop] configuration option can be used as a last resort:

```typescript
// sku.config.ts
import type { SkuConfig } from 'sku';

export default {
  __UNSAFE_EXPERIMENTAL__cjsInteropDependencies: [
    'someDependency'
  ],
  ...
} satisfies SkuConfig;
```

[cjs interop]: ./docs/configuration.md#__unsafe_experimental__cjsinteropdependencies

### Vite client types

If you require [types for Vite's client-side APIs], such as [`import.meta.glob`], create a `.d.ts` file in your codebase:

```typescript
/// <reference types="sku/vite/client" />
```

[types for Vite's client-side APIs]: https://vite.dev/guide/features#client-types
[`import.meta.glob`]: https://vite.dev/guide/features.html#glob-import
