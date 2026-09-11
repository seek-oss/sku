# Extra features

## Importing image assets

Sku supports these image types: `bmp`, `gif`, `jpg`, `jpeg`, `png`, `svg`, `webp` and `avif`.

Import an image to use it in your application:

```tsx
import heroImageUrl from './heroImage.png';

const HeroImage = () => <img src={heroImageUrl} alt="A hero image" />;
```

All supported image types except [SVG] import as strings. You can pass those strings to a `src` attribute.
The imported string is typically a URL. Files smaller than 10,000 bytes are inlined as a base64-encoded [`data:` URL].

> [!TIP]
> Browser support for `webp` and `avif` varies. To keep compatibility across browsers, consider fallback image formats with the [`picture`](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/picture) element.

```tsx
import avifImageUrl from './image.avif';
import webpImageUrl from './image.webp';
import pngImageUrl from './image.png';

const ImageWithFallbacks = () => (
  <picture>
    <source srcset={avifImageUrl} type="image/avif" />
    <source srcset={webpImageUrl} type="image/webp" />
    <img src={pngImageUrl} alt="An image" />
  </picture>
);
```

If you want a format that sku does not support yet, submit a PR or contact [support].

[SVG]: #SVGs
[`data:` URL]: https://developer.mozilla.org/en-US/docs/Web/URI/Reference/Schemes/data
[support]: /support

### SVGs

> [!TIP]
> Webpack and Vite handle SVG imports without query parameters differently. See [bundler-specific behaviour] for more information.

Sku handles SVGs differently from other image formats.
Imported SVGs are raw strings of markup that [SVGO] optimized. They are not URLs.
You can pass these markup strings to an HTML element in React:

```tsx
import svgMarkup from './icon.svg';

const MySvgComponent = () => {
  return <div dangerouslySetInnerHTML={{ __html: svgMarkup }} />;
};
```

> [!TIP]
> Prefer importing optimized SVG markup from files over rendering SVG elements with React.
> Sku does not optimize SVG elements that React renders.

Importing SVGs may not work in every case. One example is SVG elements that need user-configurable props.
In those cases, render SVG elements directly in React:

```tsx
const SvgComponent = ({ tone }: { tone: 'critical' }) => {
  const stroke = tone === 'critical' ? 'red' : 'black';

  return (
    <svg
      width="50"
      height="50"
      version="1.1"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect
        x="10"
        y="10"
        width="30"
        height="30"
        stroke={stroke}
        fill="transparent"
        stroke-width="5"
      />
    </svg>
  );
};
```

[bundler-specific behaviour]: #bundler-specific-behaviour
[SVGO]: https://github.com/svg/svgo

#### Bundler-specific behaviour

Importing SVG files with no query parameters has different behaviour in webpack and Vite.
Webpack imports the optimized contents of the SVG file.
Vite handles SVGs like any other image asset. It inlines small assets as data URLs. It returns asset URLs for larger assets.

Sku does not change the default SVG behaviour in webpack. A change could break existing apps.
As of [sku v15.13.0], webpack apps support the same `url`, `raw`, and `inline` query parameters that Vite provides for importing assets. These parameters work **only when you import SVG files**.
Applications and libraries can choose the same behaviour on both bundlers.
See [the vite docs] for more details on these query parameters.

To keep the same behaviour across bundlers, include a query parameter when you import SVG files in applications and libraries.
See [sku's Vite migration guide] for more details.

[sku v15.13.0]: https://github.com/seek-oss/sku/blob/master/packages/sku/CHANGELOG.md#15130
[the vite docs]: https://vite.dev/guide/assets#importing-asset-as-url
[sku's Vite migration guide]: ./vite#migrating-svg-imports

## Source maps

Source maps are enabled by default when you run `sku start` and when you run `sku build`.
To disable source map generation for production builds, set [`sourceMapsProd`](./configuration#sourcemapsprod) to `false`.

## Compile packages

You may want to extract and share code between sku projects. That code is likely to use the same tooling and language features that sku provides.
Sku can load packages as if they are part of your app. Use the `compilePackages` feature.

The preferred way to mark a package as a `compilePackage` is to set `"skuCompilePackage": true` in the **package's** `package.json`.
This method works only for `@seek` scoped packages.

```json
{
  "name": "@seek/my-package",
  "skuCompilePackage": true
}
```

You can also add any packages to the `compilePackages` option in the **consuming app's** sku config file.

```ts
export default {
  compilePackages: ['awesome-shared-components'],
} satisfies SkuConfig;
```

Sku compiles any `node_modules` marked as a `compilePackage` through webpack as if they are part of your app.

## Polyfills

In development mode, sku injects its own code into your bundle. Polyfills that modify the global environment must load before all other code.
Use the [`polyfills`](./configuration.md#polyfills) option to list modules to import before any other **browser** code runs.

> [!NOTE]
> Sku loads polyfills only in a browser context.
> You cannot use this feature to modify the global environment in Node.
> Isomorphic modules run on both the browser and the Node server. For isomorphic modules that must run first on both, use [`entrySideEffects`](./configuration.md#entrysideffects). Braid reset is one example.

```ts
export default {
  polyfills: [
    'promise-polyfill',
    'core-js/modules/es6.symbol',
    'regenerator-runtime/runtime',
  ],
} satisfies SkuConfig;
```

## Entry side effects

Sku provides the client and SSR entries.
Putting a module first in `App.tsx` or a root layout does not make it first in the graph.

[`entrySideEffects`](./configuration.md#entrysideffects) lists isomorphic modules that sku imports before any consumer module on Vite static and Vite SSR graphs.
That includes the browser client, the Node server, and `sku start` CSS collection.

This is the supported way to apply Braid’s CSS reset.

```ts
import type { SkuConfig } from 'sku';

export default {
  bundler: 'vite',
  entrySideEffects: ['braid-design-system/reset'],
} satisfies SkuConfig;
```

Use [`polyfills`](./configuration.md#polyfills) for browser-only globals.
Do not put `window` code in `entrySideEffects`.

## Caching

`sku` emits two caches. They can reduce the time of local and production builds.

### [Webpack filesystem cache]

This cache stores generated webpack modules and chunks.
Sku emits it only during local development.
It reduces the time to start the local development server.

> [!NOTE]
> This cache is stored in `node_modules/.cache/webpack`. You can delete it at any time.

[webpack filesystem cache]: https://webpack.js.org/configuration/cache/#cachetype

### [`babel-loader` cache]

This cache stores the result of module transpilation by `babel-loader`.
Sku emits it during local development and during production builds.
It can reduce the time to transpile TypeScript and JavaScript.
This can help local development when the webpack cache is invalid. It can also help production builds.
For applications with many source files or dependencies, this cache can reduce build times.

> [!NOTE]
> This cache is stored in `node_modules/.cache/babel-loader`. You can delete it at any time.

[`babel-loader` cache]: https://github.com/babel/babel-loader?tab=readme-ov-file#options

### Utilizing the `babel-loader` cache in CI

To use the `babel-loader` cache in CI, cache the `node_modules/.cache/babel-loader` directory with your CI provider's cache mechanism. Examples include the Buildkite [cache plugin] and the GitHub Actions [cache action].

> [!TIP]
> The Buildkite example below stores the cache in an S3 bucket.
> Add a [lifecycle configuration] to your bucket so it deletes old cache files automatically.

::: code-group

```yaml [.buildkite/pipeline.yaml]
steps:
  - label: 'Build sku app'
    command: 'pnpm exec sku build'
    # Add these environment variables and plugin item to your pipeline steps that run `sku build`
    env:
      BUILDKITE_PLUGIN_S3_CACHE_BUCKET: my-buildkite-cache-bucket
      BUILDKITE_PLUGIN_S3_CACHE_PREFIX: my-app-babel-loader-cache
    plugins:
      - cache#v1.1.0:
          path: ./node_modules/.cache/babel-loader
          restore: file
          save:
            - file
          manifest: pnpm-lock.yaml
          backend: s3
          compression: tgz
```

```yaml [.github/workflows/build.yaml]
# Add this step before the step that runs `sku build`
- name: Cache babel-loader
  id: cache-babel-loader
  uses: actions/cache@v4
  with:
    path: 'node_modules/.cache/babel-loader'
    key: babel-loader-${{ runner.os }}-${{ hashFiles('./pnpm-lock.yaml') }}
```

:::

[cache plugin]: https://github.com/buildkite-plugins/cache-buildkite-plugin
[lifecycle configuration]: https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-properties-s3-bucket-lifecycleconfiguration.html
[cache action]: https://github.com/actions/cache

## Bundle analysis

`sku` includes bundle analysis via [webpack-bundle-analyzer](https://www.npmjs.com/package/webpack-bundle-analyzer).
Sku generates a report in the `/report` directory when you run `sku build`.

## Pre-commit hook

> [!NOTE]
> The `sku pre-commit` command was removed in v16. It had little use. It also bundled `lint-staged` and its many transitive dependencies into every `sku` install. Configure the hook yourself. You then control which commands run before each commit.

To get lint and format errors before you commit, run `sku format` and `sku lint` on staged files. We recommend [nano-staged] with [husky]. nano-staged is a small alternative to `lint-staged` with no dependencies.

1. Install both tools as development dependencies:

```sh
pnpm install --dev nano-staged husky
```

2. Add the `nano-staged` config and husky's `prepare` script to your `package.json`. Adjust the nano-staged config to your project's needs. An example is below:

```json
// package.json

{
  "scripts": {
    "prepare": "husky"
  },
  "nano-staged": {
    "**/*.{js,jsx,ts,tsx,md}": ["sku format", "sku lint"]
  }
}
```

3. Create the pre-commit hook that runs `nano-staged`:

```sh
echo "pnpm nano-staged" > .husky/pre-commit
```

For more details, see the [nano-staged] and [husky] documentation.

[husky]: https://github.com/typicode/husky#husky
[nano-staged]: https://github.com/usmanyunusov/nano-staged#readme

## Assertion removal

By default, sku removes assertions in your production builds with [`babel-plugin-unassert`].
You can then run more expensive checks during development. Those checks do not affect production performance for users.

For example:

::: code-group

```tsx [Source]
import React from 'react';
import assert from 'assert';

export const Rating = ({ rating }: { rating: number }) => {
  assert(rating >= 0 && rating <= 5, 'Rating must be between 0 and 5');

  return <div>...</div>;
};
```

```js [Production]
import React from 'react';

export const Rating = ({ rating }) => <div>...</div>;
```

:::

[`babel-plugin-unassert`]: https://github.com/unassert-js/babel-plugin-unassert

### Supported Assertion Function Names

- `invariant`
- `assert`

### Supported Assertion Libraries

- [`tiny-invariant`] (Recommended)
- `assert` ([Node.js built-in] or [browser port])
- `node:assert` ([Node.js built-in])

Any combination of function name and library name is supported.
Prefer [`tiny-invariant`] over [`assert`][browser port] because it is smaller and simpler.

[`tiny-invariant`]: https://www.npmjs.com/package/tiny-invariant
[Node.js built-in]: https://nodejs.org/api/assert.html
[browser port]: https://www.npmjs.com/package/assert

## Environment-specific code

`sku` [configures][nodeEnv optimization] webpack to replace every `process.env.NODE_ENV` with its actual value.
During the `start` and `start-ssr` commands, sku replaces `process.env.NODE_ENV` with `'development'`.
During the `build` and `build-ssr` commands, sku replaces `process.env.NODE_ENV` with `'production'`.

Minification also removes dead code. You can write environment-specific code that production builds remove.

For example:

::: code-group

```js [Source]
import someDevOnlyFunction from './some-dev-only-function';
import someProdOnlyFunction from './some-prod-only-function';

if (process.env.NODE_ENV === 'development') {
  someDevOnlyFunction();
}

if (process.env.NODE_ENV === 'production') {
  someProdOnlyFunction();
}
```

```js [Development]
import someDevOnlyFunction from './some-dev-only-function';
import someProdOnlyFunction from './some-prod-only-function';

if ('development' === 'development') {
  someDevOnlyFunction();
}

if ('development' === 'production') {
  someProdOnlyFunction();
}
```

```js [Production]
import someProdOnlyFunction from './some-prod-only-function';

someProdOnlyFunction();
```

:::

In development, both `if` statements remain. Only `someDevOnlyFunction` runs.

In production, the first `if` block is removed. Its condition is always `false`.
The `someDevOnlyFunction` import is removed as well.
The second `if` block is removed. The contents of the block stay because the condition is always `true`.

[nodeEnv optimization]: https://webpack.js.org/configuration/optimization/#optimizationnodeenv

## DevServer Middleware

Set a [`devServerMiddleware`] path in your sku config. The development server can then add local-only routes, mocks, or proxies.

The file must export a function. That function receives the Express server:

```js
export default (app) => {
  app.get('/mock-api', (req, res) => {
    // ...
  });
};
```

This runs in `sku start` only. Sku never bundles it into the production server. For **SSR**, put production request handlers on the server entry’s named `middleware` export. See [Server rendering → Middleware](./ssr/middleware.md) and [`devServerMiddleware`].

[`devServerMiddleware`]: ./configuration#devservermiddleware
[express]: http://expressjs.com/
