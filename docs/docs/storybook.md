# [Storybook](https://storybook.js.org/)

This page will guide you through the process of setting up Storybook in your project.
The configuration outlined on this page should work for most projects, but you may customize it further to suit your needs.

## Installing Storybook Dependencies

To set up Storybook, you will need to install the following dev dependencies:

```sh
pnpm install -D storybook @storybook/react @storybook/react-webpack5
```

## Configuring Storybook

Storybook can be configured by creating specially-named files inside the `.storybook` folder of your app.
Take a look at the [Storybook configuration docs] for all the ways to customize Storybook.

Here's an example of a minimal, sku-compatible Storybook configuration:

```ts
// .storybook/main.ts
import { babel, webpackFinal } from 'sku/config/storybook';
import type { StorybookConfig } from '@storybook/react-webpack5';

export default {
  stories: ['../src/**/*.stories.tsx'],
  framework: '@storybook/react-webpack5',
  core: {
    builder: {
      name: '@storybook/builder-webpack5',
      options: {
        fsCache: true, // For faster startup times after the first `storybook dev`
      },
    },
  },
  babel,
  webpackFinal,
} satisfies StorybookConfig;
```

> We strongly recommend using the `babel` and `webpackFinal` configurations provided by `sku`.
> These configurations are designed to work well with `sku` and are tested as part of `sku`'s integration tests.
> While you are free use alternative configurations, we cannot provide any guarantees that Storybook will work correctly in all cases.

If you want to typecheck the files within the `.storybook` directory, you will need to add them to your [`tsconfig.json`'s `include`][tsconfig include] field.
This is necessary because the implicit default value of `include` is `['**/*']`, which does not include any directories prefixed with `.`, such as `.storybook`.

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

[Storybook configuration docs]: https://storybook.js.org/docs/react/configure/overview
[tsconfig include]: https://www.typescriptlang.org/tsconfig/#include
[dangerouslySetTSConfig]: ./docs/configuration.md#dangerouslysettsconfig

## DevServer Middleware

When running `storybook dev`, if you want to run your [`devServerMiddleware`][devserver middleware] at the same time, add a `middleware.js` file to the `.storybook` folder and re-export your middleware inside it:

```js
// .storybook/middleware.js
import devServerMiddleware from '../devServerMiddleware.js';

export default devServerMiddleware;
```

[devserver middleware]: ./docs/extra-features.md#devserver-middleware
