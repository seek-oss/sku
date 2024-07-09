---
'sku': major
---

Remove Storybook-related features from `sku`

**BREAKING CHANGE**

All Storybook-related features have been removed from `sku`. Sku no longer installs Storybook dependencies, configures Storybook, provides Storybook CLI commands, or re-exports Storybook APIs. If you are using Storybook, you will need to install Storybook dependencies yourself. See [`sku`'s Storybook documentation][storybook docs] for more information.

[storybook docs]: https://seek-oss.github.io/sku/#/./docs/storybook

**MIGRATION GUIDE**:

#### Commit your Storybook configuration

Run `sku configure` to update your ignore files:

```sh
pnpm exec sku configure
```

This will allow you to check in the `.storybook/main.ts` file to your repository. Ensure you include both of these changes **in the same commit**.

#### Install Storybook dependencies

`sku` was previously installing Storybook v7 dependencies for you. The first command below will install the latest (v8) Storybook dependencies. If you wish to stay on Storybook v7 for the time being, ensure you specify the appropriate versions of these dependencies in your app's `package.json`.

**NOTE**: Consumers that still depend on the deprecated `storiesOf` API will need to stay on Storybook v7 until they migrate away from this API.

```sh
pnpm install -D storybook @storybook/react @storybook/react-webpack5

# (Optional) This addon is required for Storybook >=8.0.0
pnpm install -D @storybook/addon-webpack5-compiler-babel
```

#### Configure Storybook

Sku no longer configures your `.storybook/main.ts` file for you. You will now need to configure it yourself. See [`sku`'s Storybook documentation][storybook docs] for more information.

`sku` now provides the `babel` and `webpackFinal` configuration objects under the `sku/config/storybook` entrypoint. These objects are best utilized within in order to  Here's an example of a minimal, `sku`-compatible Storybook configuration:

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
    // Required for Storybook >=8.0.0
    '@storybook/addon-webpack5-compiler-babel',
    // Copy addons from your `storybookAddons` sku config here
  ],
  babel,
  webpackFinal,
} satisfies StorybookConfig;
```

#### Update `package.json` scripts

The `sku` CLI no longer provides the `sku storybook` and `sku build-storybook` commands. Please migrate to [the official Storybook CLI][storybook cli]:

```diff
// package.json
{
  "scripts": {
-    "storybook": "sku storybook",
     // Replace 8081 with your custom Storybook port, if you configured one and wish to keep it
+    "storybook": "storybook dev --port 8081",
-    "build:storybook": "sku build-storybook"
+    "build:storybook": "storybook build"
  }
}
```

[storybook cli]: https://storybook.js.org/docs/cli/

#### Update Storybook imports

`sku` no longer re-exports Storybook APIs under the `sku/@storybook/react` entrypoint. Please update your imports to use the official Storybook package:

```diff
// MyComponent.stories.tsx

-import type { Meta } from 'sku/@storybook/react';
+import type { Meta } from '@storybook/react';
```

#### Update `sku` configuration

The following `sku` configuration options have been removed:

- `storybookAddons`
- `storybookPort`
- `storybookStoryStore`
- `storybookTarget`

Please remove them from your sku configuration file.
