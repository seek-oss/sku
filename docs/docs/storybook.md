# [Storybook](https://storybook.js.org/)

## Start Storybook

Running `sku storybook` will open up a local component explorer, displaying all component instances declared in files named `*.stories.js` (or `.ts`, or `.tsx`), for example:

```js
import Button from './Button';

export default {
  title: 'Button',
  component: Button,
};

export const Primary = () => <Button variant="primary">Primary</Button>;

export const Secondary = () => <Button variant="secondary">Secondary</Button>;
```

_**NOTE:** To access the Storybook API, you should import from `sku/@storybook/...`, since your project isn't depending on Storybook packages directly._

### DevServer Middleware

When running `sku storybook`, if you have configured [`devServerMiddleware`][devserver middleware] in your sku config, that middleware will be passed through to storybook and injected into its own middleware stack.

[devserver middleware]: ./docs/extra-features.md#devserver-middleware

### Storybook Port

By default, Storybook runs on port `8081`.
If you'd like to use a different port, you can provide it via the `storybookPort` option in `sku.config.js`:

```js
module.exports = {
  storybookPort: 9000,
};
```

## Addons

There are no storybook addons configured by default in sku but they can be added through the `storybookAddons` option in `sku.config.js`.

For example, if you want to use `@storybook/addon-essentials`, first install the addon.

```bash
yarn add --dev @storybook/addon-essentials
```

Then add it to your `sku.config.js`.

```js
// sku.config.js
module.exports = {
  storybookAddons: ['@storybook/addon-essentials'],
};
```

## Build Storybook

To build your Storybook, first add the following npm script:

```js
{
  "scripts": {
    "build-storybook": "sku build-storybook"
  }
}
```

Then run `npm run build-storybook`.

By default, Storybook assets are generated in the `dist-storybook` directory in your project root folder.
If you would like to specify a custom target directory, you can provide it via the `storybookTarget` option in `sku.config.js`:

```js
module.exports = {
  storybookTarget: './dist/storybook',
};
```
