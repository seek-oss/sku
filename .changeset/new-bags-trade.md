---
'sku': minor
---

Add `skipPackageCompatibilityCompilation` option

When running `sku build`, sku will compile all your external packages (`node_modules`) through `@babel/preset-env`. This is to ensure external packages satisfy the browser support policy. However, this can cause very slow builds when large packages are processed. The `skipPackageCompatibilityCompilation` option allows you to pass a list of trusted packages to skip this behaviour.

Example:

```js
const config = {
  skipPackageCompatibilityCompilation: ['@bloat/very-large-package', 'lodash'],
};
```
