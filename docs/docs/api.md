# API

`sku` provides a number of entrypoints that export configuration, utilities and types for use alongside your application.

## `sku`

Exports `sku` configuration and application entrypoint types.

Example:

```ts
import type { SkuConfig, Render } from 'sku';
```

## `sku/@loadable/component`

A re-export of the `@loadable/component` package, which `sku` provides as a dependency.
See the [code splitting documentation] for more information.

Example:

```ts
import { loadableReady } from 'sku/@loadable/component';
```

[code splitting documentation]: ./docs/code-splitting.md

## `sku/jest-preset`

A [jest preset] for consuming `sku`'s Jest configuration.
See the [testing documentation] for more information.

Example:

```js
// jest.config.js
/** @type {import('jest').Config} */
module.exports = {
  preset: 'sku',
};
```

[jest preset]: https://jestjs.io/docs/configuration#preset-string
[testing documentation]: ./docs/testing.md

## `sku/config/storybook`

Exports `sku`-compatible Storybook configuration for use within your `.storybook/main.ts` file.
See the [Storybook documentation] for more information.

Example:

```ts
import { babel, webpackFinal } from 'sku/config/storybook';
```

[Storybook documentation]: ./docs/storybook.md

## `sku/webpack-plugin`

A plugin that provides `sku` functionality to custom webpack builds.
See the [custom builds documentation] for more information.

Example:

```ts
import SkuWebpackPlugin from 'sku/webpack-plugin';
```

[custom builds documentation]: ./docs/custom-builds.md
