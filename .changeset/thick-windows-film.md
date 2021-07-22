---
'sku': major
---

Remove `@storybook/addon-knobs` in favor of allowing custom addons. 

MIGRATION GUIDE

If you still require the use of `@storybook/addon-knobs` you'll first need to install it. 

**Note**: `@storybook/addon-knobs` has been deprecated in favor of `@storybook/addon-controls`.

```bash
yarn add --dev @storybook/addon-knobs
```

Once installed, inside your `sku.config.js` file, pass `@storybook/addon-knobs` to the `storybookAddons` option.

```js
// sku.config.js
module.exports = {
  storybookAddons: ['@storybook/addon-knobs']
}
```

