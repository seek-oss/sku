# Storybook

This page guides you through configuring [Storybook] in your project.
The configuration on this page should work for most projects.
You may customize it further to suit your needs.

[Storybook]: https://storybook.js.org/

## Installing Storybook Dependencies

Install the appropriate dependencies for your configured [`bundler`]:

::: code-group

```sh [Vite]
pnpm install -D storybook @storybook/react @storybook/react-vite
```

```sh [Webpack]
pnpm install -D storybook @storybook/react @storybook/react-webpack5 @storybook/addon-webpack5-compiler-babel
```

:::

[`bundler`]: ./configuration#bundler

## Configuring Storybook

You can configure Storybook by creating specially-named files inside a `.storybook` folder within your repo.
See the [Storybook configuration documentation] for all the ways to customize Storybook.

> [!IMPORTANT]
> We strongly recommend using the `babel` + `webpackFinal`/`viteFinal` configurations provided by `sku`.
> sku tests these configurations in its integration tests.
> You are free to use alternative configurations.
> We cannot provide any guarantees that Storybook will work correctly in such cases.

Here is an example of a minimal, sku-compatible Storybook configuration:

::: code-group

```ts [Vite]
// .storybook/main.ts
import { viteFinal } from 'sku/config/storybook';
import type { StorybookConfig } from '@storybook/react-vite';

export default {
  stories: ['../src/**/*.stories.tsx'],
  framework: {
    name: '@storybook/react-vite',
    options: {},
  },
  viteFinal,
} satisfies StorybookConfig;
```

```ts [Webpack]
// .storybook/main.ts
import { babel, webpackFinal } from 'sku/config/storybook';
import type { StorybookConfig } from '@storybook/react-webpack5';

export default {
  stories: ['../src/**/*.stories.tsx'],
  framework: {
    name: '@storybook/react-webpack5',
    options: {
      builder: {
        fsCache: true, // For faster startup times after the first `storybook dev`
      },
    },
  },
  addons: [
    '@storybook/addon-webpack5-compiler-babel', // Required for Storybook >=8.0.0
  ],
  babel,
  webpackFinal,
} satisfies StorybookConfig;
```

:::

### Type-checking the `.storybook` directory

If you want to type-check the files within the `.storybook` directory, add them to your [`tsconfig.json`'s `include`][tsconfig include] field.
This is necessary because the implicit default value of `include` is `['**/*']`.
That default does not include any directories prefixed with `.`, such as `.storybook`.

You can do this via [`sku`'s `dangerouslySetTSConfig` configuration option][dangerouslySetTSConfig]:

```ts
// sku.config.ts
import type { SkuConfig } from 'sku';

export default {
  dangerouslySetTSConfig: (config) => ({
    ...config,
    include: [
      '**/*', // Implicit default value if `include` is not set and `files` is not set
      '.storybook/**/*', // 👈 Add this line
    ],
  }),
} satisfies SkuConfig;
```

[Storybook configuration documentation]: https://storybook.js.org/docs/react/configure/overview
[tsconfig include]: https://www.typescriptlang.org/tsconfig/#include
[dangerouslySetTSConfig]: ./configuration.md#dangerouslysettsconfig

## Developing and Building Your Storybook

To start a development version of your Storybook, run:

```sh
pnpm storybook dev
```

To build a production version of your Storybook that you can deploy, run:

```sh
pnpm storybook build
```

If you have a [multi-language] application, compile your translations before you run the Storybook CLI:

```sh
pnpm sku translations compile && pnpm storybook dev # or pnpm storybook build
```

You can run a development Storybook and see Vocab translations update as they change.
Run the [`sku translations compile --watch`][translations compile watch] command at the same time as `storybook dev`.
You can do this with a package such as [`concurrently`].
If you use `pnpm`, you can use `pnpm`'s built-in support for [running multiple scripts] in parallel.

Please read the [Storybook CLI documentation] for more information.

[multi-language]: ./multi-language
[translations compile watch]: ./cli#translations-compile
[`concurrently`]: https://www.npmjs.com/package/concurrently
[running multiple scripts]: https://pnpm.io/8.x/cli/run#running-multiple-scripts
[Storybook CLI documentation]: https://storybook.js.org/docs/cli/

## DevServer Middleware

When you run `storybook dev`, you can also run your [`devServerMiddleware`][devserver middleware].
Add a `middleware.js` file to the `.storybook` folder.
Re-export your middleware inside it:

```js
// .storybook/middleware.js
import devServerMiddleware from '../devServerMiddleware.js';

export default devServerMiddleware;
```

[devserver middleware]: ./extra-features.md#devserver-middleware
