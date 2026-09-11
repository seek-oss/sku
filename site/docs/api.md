# API

`sku` exports configuration, utilities, and types from several entrypoints. Use them alongside your application.

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

[code splitting documentation]: ./code-splitting.md

## `sku/jest-preset`

A [jest preset] that uses `sku`'s Jest configuration.
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
[testing documentation]: ./testing.md

## `sku/config/eslint`

Exports `sku`'s custom eslint config based on [`eslint-config-seek`].

> [!NOTE]
> Sku configures eslint for you. You should not need to use this export directly.

Example:

```ts
import { eslintConfigSku } from 'sku/config/eslint';

export default eslintConfigSku;
```

[`eslint-config-seek`]: https://github.com/seek-oss/eslint-config-seek

## `sku/config/storybook`

Exports `sku`-compatible Storybook configuration for use in your `.storybook/main.ts` file.
See the [Storybook documentation] for more information.

Example:

```ts
import { babel, webpackFinal } from 'sku/config/storybook';
```

[Storybook documentation]: ./storybook.md

## `sku/webpack-plugin`

A plugin that adds `sku` behaviour to custom webpack builds.
See the [custom builds documentation] for more information.

Example:

```ts
import { SkuWebpackPlugin } from 'sku/webpack-plugin';
```

[custom builds documentation]: ./custom-builds.md
