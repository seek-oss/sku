---
'sku': major
---

Migrating `sku` to ESM from commonjs

**BREAKING CHANGE**:

`sku` now uses ESM modules instead of commonjs.

If your project is not already using ESM modules you will have to make the following changes:

___

`sku.config` files must now be written in TypeScript or ESM.

If you are already using a `sku.config.ts` file no changes are required.
If you are using a `sku.config.js` file you will either have to move to a `ts` or `mjs` file and update the `sku.config` accordingly.

___

`sku/webpack-plugin` is now an ESM module and has to be imported as such.

If you are using `require()` to import `sku/webpack-plugin` you will have to change it to `import`.

```diff
- const SkuWebpackPlugin = require('sku/webpack-plugin');
+ import SkuWebpackPlugin from 'sku/webpack-plugin';
```

> [!NOTE]
> The file that is importing `sku/webpack-plugin` must also be an ESM module so further changes may be required.

___

`sku@14` uses `eslint` flat config and it will try to migrate your `.eslintignore` and `.eslintrc` files automatically.
If a custom eslint configuration is required and you want to use the `sku/config/eslint` it will have to be ESM.
