# [Storybook](https://storybook.js.org/)

## Start Storybook

Running `sku storybook` will open up a local component explorer, displaying all component instances declared in files named `*.stories.js` (or `.ts`, or `.tsx`), for example:

```tsx
import Button from './Button';

import type { Meta } from 'sku/@storybook/react';

export default {
  title: 'Button',
  component: Button,
} satisfies Meta;

export const Primary = () => <Button variant="primary">Primary</Button>;

export const Secondary = () => <Button variant="secondary">Secondary</Button>;
```

_**NOTE:** To access the Storybook API, you should import from `sku/@storybook/...`, since your project isn't depending on Storybook packages directly._

## Configuration

Storybook can be configured by creating specially-named files inside the `.storybook` folder of your app.
Take a look at the [Storybook configuration docs] for all the ways to customize your Storybook.

_**NOTE:** sku maintains control of the `main.js` configuration file as it is critical to ensuring compatibility between Storybook and your app.
If you have a valid use case for customizing this file, please reach out in [`#sku-support`]._

[Storybook configuration docs]: https://storybook.js.org/docs/react/configure/overview
[`#sku-support`]: https://seekchat.slack.com/channels/sku-support

### Addons

There are no storybook addons configured by default in sku but they can be added through the `storybookAddons` option in `sku.config.ts`.

For example, if you want to use `@storybook/addon-essentials`, first install the addon.

```bash
yarn add --dev @storybook/addon-essentials
```

Then add it to your `sku.config.ts`.

```ts
export default {
  storybookAddons: ['@storybook/addon-essentials'],
} satisfies SkuConfig;
```

### Story Rendering

Story rendering can be customized globally by creating a `.storybook/preview.js` (or `.ts`, or `.tsx`) file.

```tsx
import 'braid-design-system/reset';

import apac from 'braid-design-system/themes/apac';
import { BraidProvider } from 'braid-design-system';

import React from 'react';

import type { Preview } from 'sku/@storybook/react';

// This will wrap every story in a BraidProvider
export default {
  decorators: [
    (Story) => (
      <BraidProvider theme={apac}>
        <Story />
      </BraidProvider>
    ),
  ],
} satisfies Preview;
```

See [the Storybook docs][storybook preview.js] for more info.

[storybook preview.js]: https://storybook.js.org/docs/react/configure/overview#configure-story-rendering

### DevServer Middleware

When running `sku storybook`, if you want to run your [`devServerMiddleware`][devserver middleware] at the same time, add a `middleware.js` file to the `.storybook` folder and export it:

```js
// .storybook/middleware.js
import devServerMiddleware from '../devServerMiddleware.js';

export default devServerMiddleware;
```

[devserver middleware]: ./docs/extra-features.md#devserver-middleware

### Storybook Port

By default, Storybook runs on port `8081`.
If you'd like to use a different port, you can provide it via the `storybookPort` option in `sku.config.ts`:

```ts
export default {
  storybookPort: 9000,
} satisfies SkuConfig;
```

## Build Storybook

To build your Storybook, first add the following npm script:

```json
{
  "scripts": {
    "build-storybook": "sku build-storybook"
  }
}
```

Then run `npm run build-storybook`.

By default, Storybook assets are generated in the `dist-storybook` directory in your project root folder.
If you would like to specify a custom target directory, you can provide it via the `storybookTarget` option in `sku.config.ts`:

```ts
export default {
  storybookTarget: './dist/storybook',
} satisfies SkuConfig;
```
