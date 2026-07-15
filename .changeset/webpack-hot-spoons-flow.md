---
'sku': major
---

`webpack`: Remove deprecated default export from `sku/webpack-plugin` entrypoint

**BREAKING CHANGE**

The named export `SkuWebpackPlugin` is now the only export provided by the `sku/webpack-plugin` entrypoint.

```diff
-import SkuWebpackPlugin from 'sku/webpack-plugin';
+import { SkuWebpackPlugin } from 'sku/webpack-plugin';
```
