---
'sku': minor
---

Add `storybookAddons` config option

Custom storybook addons can now be used via the `storybookAddons` config option. For example, if you want to use `@storybook/addon-essentials`, first install the addon.

```bash
yarn add --dev @storybook/addon-essentials
```

Then add it to your `sku.config.js`.

```js
// sku.config.js
module.exports = {
  storybookAddons: ['@storybook/addon-essentials']
}
```