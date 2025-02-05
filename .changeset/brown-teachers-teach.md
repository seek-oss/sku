---
'sku': major
---

Migrating `sku` to ESM from commonjs

**BREAKING CHANGE**:

Most of [`sku`s API entrypoints](https://seek-oss.github.io/sku/#/./docs/api) are now ESM. Consumers that use the following API entrypoints may need to convert some of their configuration files to ESM:
___

`sku/webpack-plugin` is now an ES module and has to be imported as such.

If you are using `require()` to import `sku/webpack-plugin` you will have to change it to `import`.

```diff
- const SkuWebpackPlugin = require('sku/webpack-plugin');
+ import SkuWebpackPlugin from 'sku/webpack-plugin';
```

> [!NOTE]
> The file that is importing `sku/webpack-plugin` must also be an ES module so further changes may be required.

___

`sku/config/eslint` is a new entrypoint that exposes `sku`'s ESLint configuration.

`sku@14` now uses `eslint` flat config and it will try to migrate your `.eslintignore` and `.eslintrc` files automatically.

If a custom `eslint` configuration is required and you want to use the `sku/config/eslint` you will need to convert your `eslint.config.js` file to ESM.
