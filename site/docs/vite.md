# Vite

[Vite]: https://vite.dev/

[Vite] is a frontend build tool. It serves files on demand over native ESM. It also provides hot module reloading.
Sku supports Vite as an alternative to the Webpack bundler since v15.

## Limitations

Vite support is currently available only for [static applications (SSG)][SSG]. Static applications render HTML at build time.
This means only [`sku start`] and [`sku build`] are supported.
[`sku serve`] is also available. It does not depend on the bundler.

> **Experimental — SSR Support.**
> A Vite-based Managed Data Mode SSR is available for evaluation and testing.
> Do not use it in production yet. The API and behaviour may change. See [SSR].

[`sku start`]: ./cli.md#start
[`sku build`]: ./cli.md#build
[`sku serve`]: ./cli.md#serve

### Planned deprecation of library mode

`sku` currently supports building [libraries] with webpack.
This feature is planned for deprecation. Vite will not support it.
A migration guide for `sku` libraries will be provided after the deprecation is final.

[SSG]: ./static-rendering.md
[SSR]: ./ssr/
[libraries]: ./libraries.md

## Prerequisites

> [!WARNING]
> Before you change your application, read this document in full.

Migrating to Vite has two required prerequisites:

1. [Applications must be written in ESM][Migrating to ESM]
2. [Applications must use Vitest for running tests][Migrating to Vitest]

Given [Jest's current limitations with ESM], you will likely need to implement both prerequisites at the same time.

**We recommend that you implement, test, and release these changes separately from the changes that [migrate to Vite][Migrating to Vite].**

[Migrating to ESM]: #migrating-to-esm
[Migrating to Vitest]: #migrating-to-vitest
[Migrating to Vite]: #migrating-to-vite

### Migrating to Vitest

[Vitest] is a testing framework. It supports ESM without extra setup. It integrates with the Vite ecosystem. Its API is similar to Jest.
These features make it a replacement for Jest in `sku` applications, especially given [Jest's current limitations with ESM].
**Because of these limitations, you will likely need to migrate to Vitest at the same time as migrating to ESM, or before that.**

See [sku's vitest documentation](./vitest.md) for how to migrate to Vitest.

[Vitest]: https://vitest.dev/
[Jest's current limitations with ESM]: https://jestjs.io/docs/ecmascript-modules
[test runner]: ./configuration.md#testrunner
[Vitest CLI]: https://vitest.dev/guide/cli.html
[codemod]: https://codemod.com/registry/jest-vitest
[Migrating from Jest to Vitest]: https://vitest.dev/guide/migration.html#jest
[Vitest globals]: https://vitest.dev/config/#globals

### Migrating to ESM

Migrating to ESM involves two steps:

1. [Ensure your application declares itself as an ES module][Declaring an ES module]
1. [Ensure all application code uses ESM syntax for importing and exporting modules][ESM syntax]

[Declaring an ES module]: #declaring-an-es-module
[ESM syntax]: #esm-syntax

#### Declaring an ES module

To declare your package as an ES module, add `"type": "module"` to your `package.json` file:

```json
{
  "name": "my-sku-app",
  "type": "module", // [!code ++]
  "scripts": {
    "start": "sku start",
    "build": "sku build"
  }
}
```

This change tells Node.js and TypeScript that **any code in `.js` or `.ts` files should be treated as ESM**.

You may also have non-application code that this change affects. Examples include Node.js scripts and configuration files.
If these files contain [CommonJS (CJS)][CommonJS] syntax and you do not want to convert them to ESM, keep them as CommonJS. Use the `.cjs` or `.cts` file extensions.
**We recommend that you convert all code to ESM if you can.**

#### Finding ESM code changes

After you set the repo to `type: module`, you can use the [eslint-cjs-to-esm](https://github.com/azu/eslint-cjs-to-esm) package to check for ESM code changes:

```bash
npx eslint-cjs-to-esm "./src/**/*.{js,ts}" --rule "node/file-extension-in-import: off, file-extension-in-import-ts/file-extension-in-import-ts: off, import/extensions: off"
```

Common files that may need updates include:

- [Dev server middleware][devServerMiddleware]
- [Polyfills][polyfills]
- Configuration for external tooling

The following sections describe changes that may be required to migrate CJS code to ESM.

[devServerMiddleware]: ./configuration.md#devservermiddleware
[polyfills]: ./configuration.md#polyfills

#### ESM syntax

Most application code at SEEK already uses ESM syntax. You are unlikely to need many changes in your application.
If you _do_ need to convert some code to ESM, the main change is to use the correct import syntax.

In ESM, import modules with the `import` keyword. Export modules with the `export` keyword:

```ts
// named imports
const { foo } = require('foo'); // [!code --]
import { foo } from 'foo'; // [!code ++]

// default imports
const express = require('express'); // [!code --]
import express from 'express'; // [!code ++]

// named exports
const SOME_CONSTANT = 'some value'; // [!code --];
module.exports = { SOME_CONSTANT }; // [!code --];
export const SOME_CONSTANT = 'some value'; // [!code ++]

// default exports
const ANOTHER_CONSTANT = '123';
module.exports = ANOTHER_CONSTANT; // [!code --]
export default ANOTHER_CONSTANT; // [!code ++]
```

#### Import path file extensions

[ESM resolution][explicit file extensions] usually requires a file extension on relative and absolute import specifiers. Directory indexes (`index.js` files) must also be fully specified.

Vite can resolve these imports for you. You only need file extensions in import paths in non-application code.

> [!TIP]
> By default, `sku` sets `allowImportingTsExtensions: true` in your `tsconfig.json` file.
> When an explicit file extension is required, such as in a Node.js script, this setting lets you import TypeScript files with a `.ts` extension instead of a `.js` extension. That difference can confuse people who are new to ESM codebases.

[ESM]: https://nodejs.org/api/esm.html
[CommonJS]: https://nodejs.org/api/modules.html
[explicit file extensions]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/import#:~:text=you%20cannot%20omit%20the%20file%20extension%20or%20the%20index.js%20file%20name.%20

## Migrating to Vite

To bundle your applications with Vite, set [`bundler`][bundler] in your `sku` config:

```typescript
// sku.config.ts
import type { SkuConfig } from 'sku';

export default {
  bundler: 'vite',
  ...
} satisfies SkuConfig;
```

Depending on your application, you may need no further codebase changes after this point to run with Vite.

The list below documents differences between `sku` with `webpack` and `sku` with Vite.

> [!TIP]
> If you find issues during migration that this list does not cover, contact us via the [support page] so we can update this document.

[bundler]: ./configuration.md#bundler
[support page]: /support

### Code splitting

Routes and components that use `sku`'s [code splitting] API must update imports from `sku/@loadable/component` to `@sku-lib/vite/loadable`.
A codemod can help with this migration:

```bash
pnpm dlx @sku-lib/codemod transform-vite-loadable .
```

You also need to install a separate library that provides Vite-compatible loadable APIs:

```bash
pnpm add @sku-lib/vite
```

`@sku-lib/vite/loadable` uses React's [`<Suspense />`][suspense] component to load a fallback state.
You can wrap a `loadable` component in a `<Suspense />` component. You can also pass a `fallback` option to the `loadable` function. That option wraps the component in a `<Suspense />` component for you:

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

> [!NOTE]
> To use `loadable` with a `fallback`, your application must use the `renderToStringAsync` API.
> See the [supporting react suspense] documentation for more information.

[Code splitting]: ./code-splitting.md
[suspense]: https://react.dev/reference/react/Suspense
[supporting react suspense]: ./static-rendering.md#supporting-react-suspense

### Dev server middleware

The Vite dev server uses [`Connect`](https://github.com/senchalabs/connect) as its server framework. `webpack` uses [`Express`](https://expressjs.com/).
The middleware API has changed. The middleware function now receives a `Connect.Server` instance. Use that instance to add middleware to the dev server.

Add middleware to the dev server with the [`use`] method on the server instance:

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

> [!NOTE]
> Currently only JavaScript middleware is supported.

[`use`]: https://github.com/senchalabs/connect#use-middleware

### CJS named imports

Importing named exports from CJS dependencies may produce an error:

```
SyntaxError: [vite] Named export 'someFunction' not found. The requested module 'someDependency' is a CommonJS module, which may not support all module.exports as named exports.
CommonJS modules can always be imported via the default export, for example using:

import pkg from 'someDependency';
const {someFunction} = pkg;
```

You have a few options to resolve this issue:

- Replace the dependency with native APIs
- Upgrade the dependency to a version that supports ESM
- Replace the dependency with an alternative that supports ESM

If those options fail, `sku` provides a [`compilePackages`][compilePackages] option. Sku compiles the given modules as if they are part of your source code.
This may affect build time. It can let Vite handle certain CJS dependencies without throwing the error above.
_Use this option as a last resort_:

```ts
// sku.config.ts
import type { SkuConfig } from 'sku';

export default {
  compilePackages: [
    'someDependency'
  ],
  ...
} satisfies SkuConfig;
```

[compilePackages]: ./configuration.md#compilepackages

### Vite client types

If you need [types for Vite's client-side APIs], such as [`import.meta.glob`], or types for [imported image assets], create a `.d.ts` file in your codebase:

```ts
// src/vite-env.d.ts

// eslint-disable-next-line spaced-comment
/// <reference types="sku/vite/client" />
```

[types for Vite's client-side APIs]: https://vite.dev/guide/features#client-types
[imported image assets]: https://vite.dev/guide/assets#importing-asset-as-url
[`import.meta.glob`]: https://vite.dev/guide/features.html#glob-import

### Importing image assets

Vite provides built-in support for importing image assets as URLs.
See [the importing image assets docs] for more info.

#### Migrating SVG imports

Importing SVG files with no query parameters has different behaviour in webpack and Vite.
You will need to update SVG imports in your application so they work with Vite.

> [!IMPORTANT]
> Your application must be on at least [sku v15.13.0] in order to use the `raw`, `url` and `inline` query parameters described below.

The simplest migration is to add the `raw` query parameter to all SVG imports in your codebase. That imports the raw SVG markup as a string in both webpack and Vite. You can do this automatically with the `svg-import-query-param` codemod:

```sh
pnpm dlx @sku-lib/codemod svg-import-query-param .
```

If you constructed [`data:` URLs] by hand from the imported SVG markup, use the `url` or `inline` query parameters instead. `url` imports the SVG as a URL. `inline` imports it as a data URL. You then do not need to construct a data URL yourself:

```ts
import { style } from '@vanilla-extract/css';
import iconMarkup from './icon.svg?raw'; // [!code --]

// URL of the SVG file
import iconUrl from './icon.svg?url'; // [!code ++]

// or SVG data URL
import iconUrl from './icon.svg?inline'; // [!code ++]

export const svgBackground = style({
  backgroundImage: `url("data:image/svg+xml;base64,${Buffer.from(iconMarkup).toString('base64')}")`, // [!code --]
  backgroundImage: `url("${iconUrl}")`, // [!code ++]
});
```

You will also need to make similar changes in any libraries you consume that import SVG files.
Consumers of these libraries may see inconsistent results when they import SVG files. The result depends on the query parameters the library uses and the version of `sku` they use.
If you change libraries for Vite compatibility, state those changes clearly in the release notes.

### Storybook

If your repo uses `sku`'s Storybook config (via the [`sku/config/storybook`] entrypoint), we recommend Vite for Storybook instead of webpack.
See [sku's Storybook documentation] for more information.

[sku v15.13.0]: https://github.com/seek-oss/sku/blob/master/packages/sku/CHANGELOG.md#15130
[the vite docs]: https://vite.dev/guide/assets#importing-asset-as-url
[the importing image assets docs]: ./extra-features.md#importing-image-assets
[`data:` URLs]: https://developer.mozilla.org/en-US/docs/Web/URI/Reference/Schemes/data
[sku's Storybook documentation]: ./api#sku-config-storybook
