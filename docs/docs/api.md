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

Example:

```ts
import { loadableReady } from 'sku/@loadable/component';
```

## `sku/@storybook/react`

A re-export of the `@storybook/react` package, which `sku` provides as a dependency.

Example:

```ts
import type { StoryObj } from 'sku/@storybook/react';
```

## `sku/config/jest`

A jest preset for consuming `sku`'s Jest configuration.
See the [testing documentation] for more information.

Example:

```js
// jest.config.js
/** @type {import('jest').Config} */
module.exports = {
  preset: 'sku/config/jest',
};
```

## `sku/config/storybook`

Exports storybook config compatible with `sku`.
`sku` creates your Storybook configuration for you, so you don't need to use this directly.

Example:

```ts
import storybookConfig from 'sku/config/storybook';
```

[testing documentation]: ./docs/testing.md

## `sku/webpack-plugin`

A plugin that provides `sku` functionality to custom webpack builds.
See the [custom builds documentation] for more information.

Example:

```ts
import SkuWebpackPlugin from 'sku/webpack-plugin';
```

[custom builds documentation]: ./docs/custom-builds.md
