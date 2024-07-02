# [Storybook](https://storybook.js.org/)

This page will guide you through the process of setting up Storybook in your project.
The configuration outlined on this page should work for most projects, but you may customize it further to suit your needs.

## Installing Storybook Dependencies

To set up Storybook, you will need to install the following dev dependencies:

```sh
pnpm install -D storybook @storybook/react @storybook/react-webpack5 @storybook/addon-webpack5-compiler-babel
```

## Configuring Storybook

Storybook can be configured by creating specially-named files inside a `.storybook` folder within your repo.
Take a look at the [Storybook configuration documentation] for all the ways to customize Storybook.

Here's an example of a minimal, sku-compatible Storybook configuration:

```ts
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

> We strongly recommend using the `babel` and `webpackFinal` configurations provided by `sku`.
> These configurations and are tested as part of `sku`'s integration tests in order to ensure they function correctly.
> While you are free to use alternative configurations, we cannot provide any guarantees that Storybook will work correctly in such cases.

If you want to typecheck the files within the `.storybook` directory, you will need to add them to your [`tsconfig.json`'s `include`][tsconfig include] field.
This is necessary because the implicit default value of `include` is `['**/*']` which does not include any directories prefixed with `.`, such as `.storybook`.

This can be done via [`sku`'s `dangerouslySetTSConfig` configuration option][dangerouslySetTSConfig]:

```ts
// sku.config.ts
import type { SkuConfig } from 'sku';

export default {
  dangerouslySetTSConfig: (config) => ({
    ...config,
    include: [
      '**/*', // Implicit default value if `include` is not set and `files` is not set
      '.storybook/*', // 👈 Add this line
    ],
  }),
} satisfies SkuConfig;
```

[Storybook configuration documentation]: https://storybook.js.org/docs/react/configure/overview
[tsconfig include]: https://www.typescriptlang.org/tsconfig/#include
[dangerouslySetTSConfig]: ./docs/configuration.md#dangerouslysettsconfig

## Developing and Building Your Storybook

To serve a development version of your Storybook, run:

```sh
pnpm exec storybook dev
```

To build a deployable, production version of your Storybook, run:

```sh
pnpm exec storybook build
```

Please read the [Storybook CLI documentation] for more information.

[Storybook CLI documentation]: https://storybook.js.org/docs/cli/

## DevServer Middleware

When running `storybook dev`, if you want to run your [`devServerMiddleware`][devserver middleware] at the same time, add a `middleware.js` file to the `.storybook` folder and re-export your middleware inside it:

```js
// .storybook/middleware.js
import devServerMiddleware from '../devServerMiddleware.js';

export default devServerMiddleware;
```

[devserver middleware]: ./docs/extra-features.md#devserver-middleware
