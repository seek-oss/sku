# Vite

[Vite]: https://vite.dev/
[`#sku-support`]: https://seek.enterprise.slack.com/archives/CDL5VP5NU

[Vite] describes itself as "a blazing fast frontend build tool powering the next generation of web applications".
It has on demand file serving over native ESM and lightning fast hot module reloading.
Sku supports Vite as an alternate to the Webpack bundler since v15.

## Limitations

Vite support covers [static applications (SSG)][SSG] and opt-in [server-side rendering (SSR)][SSR].

- Static apps use [`sku start`] and [`sku build`] as today.
- Vite SSR apps set `bundler: 'vite'` and `renderType: 'server-side-rendered'`, then also use [`sku start`] / [`sku build`] (not `start-ssr` / `build-ssr`).
- Webpack SSR continues to use [`sku start-ssr`] / [`sku build-ssr`] when `renderType` is unset.

[`sku start`]: ./docs/CLI.md#start
[`sku build`]: ./docs/CLI.md#build
[`sku serve`]: ./docs/CLI.md#serve
[`sku start-ssr`]: ./docs/CLI.md#start-ssr
[`sku build-ssr`]: ./docs/CLI.md#build-ssr

### Vite SSR

> **Experimental — not for production.** Vite SSR is available for evaluation and testing. Do not use it in production yet; the API and behaviour may change. See [Server rendering](./docs/server-rendering.md).

Set `renderType: 'server-side-rendered'` and export named `routes` (`RouteObject[]`) from **both** `serverEntry` and `clientEntry` (defaults `src/server.tsx` / `src/client.tsx`). Prefer a shared `createRoutes(...)` factory so the trees stay hydration-compatible:

```ts
// src/routes.tsx
import type { RouteObject } from 'react-router';

export function createRoutes(): RouteObject[] {
  return [/* React Router Data Mode routes (prefer lazy) */];
}
```

```ts
// src/server.tsx / src/client.tsx
import { createRoutes } from './routes';

export const routes = createRoutes();
```

Required `serverEntry` must also export named `middleware` (Connect/Express handlers; empty array / passthrough OK) and named `onRequest`. Required `clientEntry` must also export named `onHydrate`. Missing entry files or named exports (including missing / non-array `routes`) are a hard error; do not use `default`. Optional config [`devServerMiddleware`](./docs/configuration.md#devservermiddleware) mounts local-only mocks in `sku start` before server-entry `middleware` and is never imported into the production server — see [Server rendering → Middleware](./docs/server-rendering.md#middleware).

sku owns the HTTP server, the React Document shell (not overridable — use React 19 metadata in routes/layouts for head/SEO), full-document streaming (`renderToPipeableStream`), document hydration, and CSP HTTP headers. Requires React 19+. Vite SSR requires a relative `publicPath` (absolute / CDN URLs are rejected).

`onRequest` may return a closed object under Vite SSR: `AppWrapper` (providers only; mounted inside the router as a pathless layout so it may use React Router hooks), `language` (server Document vocab preload only — not forwarded to `onHydrate`), and JSON `clientContext`. `onHydrate` receives `{ context }` only and may return `AppWrapper`. Prefer React Router `lazy: () => import('./pages/…')` so routes become separate async chunks; sku auto-derives `handle.moduleId` for production `modulepreload`s (set it explicitly only as an escape hatch). When `languages` is configured, sku registers the active vocab language chunk from the server entry `language` (sole-language fallback when only one language is set). Client locale re-derives via providers / React Router hooks (or optional `clientContext`).

Scaffold a new app with:

```sh
pnpm dlx @sku-lib/create my-app --template vite-ssr
```

See [Server rendering](./docs/server-rendering.md) (including [Migrating from a static app](./docs/server-rendering.md#migrate-from-static-app) and [Migrating from an older SSR app](./docs/server-rendering.md#migrate-from-older-ssr-app)) and [CSP](./docs/csp.md) for details.

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

### Migrating to Vitest

[Vitest] is a testing framework that supports ESM out-of-the-box, integrates with the Vite ecosystem and has a similar API to Jest.
These features make it a great replacement for Jest in `sku` applications, especially given [Jest's current limitations with ESM].
**Due to these limitations, it's likely that you'll need to migrate to Vitest at the same time as (or prior to) migrating to ESM.**

See [sku's vitest documentation](./docs/vitest.md) for how to migrate to vitest.

[Vitest]: https://vitest.dev/
[Jest's current limitations with ESM]: https://jestjs.io/docs/ecmascript-modules
[test runner]: ./docs/configuration.md#testrunner
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

Common files that may need to be updated include:

- [Dev server middleware][devServerMiddleware]
- [Polyfills][polyfills]
- Configuration for external tooling

The following sections detail changes that may be required to migrate CJS code to ESM.

[devServerMiddleware]: ./docs/configuration.md#devservermiddleware
[polyfills]: ./docs/configuration.md#polyfills

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

## Migrating to Vite

To configure `sku` to bundle your applications with Vite, configure [`bundler`][bundler] in your `sku` config:

```typescript
// sku.config.ts
import type { SkuConfig } from 'sku';

export default {
  bundler: 'vite',
  ...
} satisfies SkuConfig;
```

Depending on your application, you may need no further changes to your codebase after this point in order to run your application with Vite.

Documented below is a list of differences between `sku` with `webpack` and `sku` with Vite.

?> If you encounter issues during migration that aren't listed below, please reach out in [`#sku-support`] so we can update this document.

[bundler]: ./docs/configuration.md#bundler
[`#sku-support`]: https://seek.enterprise.slack.com/archives/CDL5VP5NU

### Code splitting

Routes and components that take advantage of `sku`'s [code splitting] API will need to update imports from `sku/@loadable/component` to `@sku-lib/vite/loadable`.
A codemod is available to help with this migration:

```bash
pnpm dlx @sku-lib/codemod transform-vite-loadable .
```

You will also need to install a separate library that provides Vite-compatible loadable APIs:

```bash
pnpm add @sku-lib/vite
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

Config [`devServerMiddleware`](./docs/configuration.md#devservermiddleware) mounts a consumer module during `sku start` only.

**Static Vite** uses [`Connect`](https://github.com/senchalabs/connect) as its server framework (webpack uses [`Express`](https://expressjs.com/)). The middleware function receives a `Connect.Server` instance:

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

**Vite SSR** (`renderType: 'server-side-rendered'`) uses Express on the custom single-port server. The same config key receives the Express app, and is mounted **before** the server entry’s named `middleware` (then Vite, then HTML render). Production never loads this file — see [Server rendering → Middleware](./docs/server-rendering.md#middleware).

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

Failing those solutions, `sku` provides a [`compilePackages`][compilePackages] option that will compile the given modules as if they were part of your source code.
This may affect build time, but allows Vite to handle certain CJS dependencies without throwing the error above.
_Use this option as a last resort_:

```typescript
// sku.config.ts
import type { SkuConfig } from 'sku';

export default {
  compilePackages: [
    'someDependency'
  ],
  ...
} satisfies SkuConfig;
```

[compilePackages]: ./docs/configuration.md#compilePackages

### Vite client types

If you require [types for Vite's client-side APIs], such as [`import.meta.glob`], or types for [imported image assets], create a `.d.ts` file in your codebase:

```typescript
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
SVG imports within your application will need to be updated in order to function correctly with Vite.

?> Your application must be on at least [sku v15.13.0] in order to use the `raw`, `url` and `inline` query parameters described below.

The simplest way to migrate is to add the `raw` query parameter to all SVG imports in your codebase, which will import the raw SVG markup as a string in both webpack and Vite. This can be done automatically with the `svg-import-query-param` codemod:

```sh
pnpm dlx @sku-lib/codemod svg-import-query-param .
```

If you were manually constructing [`data:` URLs] from the imported SVG markup, you can instead use the `url` or `inline` query parameters to import the SVG as a URL or data URL respectively, removing the need to construct a data URL yourself:

```diff
import { style } from '@vanilla-extract/css';
-import iconMarkup from './icon.svg?raw';

// URL of the SVG file
+import iconUrl from './icon.svg?url';
// or SVG data URL
+import iconUrl from './icon.svg?inline';

export const svgBackground = style({
-  backgroundImage: `url("data:image/svg+xml;base64,${Buffer.from(iconMarkup).toString('base64')}")`,
+  backgroundImage: `url("${iconUrl}")`,
});
```

Similar changes will need to be made in any libraries you consume that import SVG files.
Consumers of these libraries may see inconsistent results when importing SVG files, depending on the query parameters used by the library and the version of `sku` they are using.
Ensure changes made to libraries for the purpose of Vite compatibility are communicated clearly in the release notes.

[sku v15.13.0]: https://github.com/seek-oss/sku/blob/master/packages/sku/CHANGELOG.md#15130
[the vite docs]: https://vite.dev/guide/assets#importing-asset-as-url
[the importing image assets docs]: ./docs/extra-features.md#importing-image-assets
[`data:` URLs]: https://developer.mozilla.org/en-US/docs/Web/URI/Reference/Schemes/data
