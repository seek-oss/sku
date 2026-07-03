---
'sku': major
---

Remove deprecated default export from `sku/webpack-plugin` entrypoint

The named export `SkuWebpackPlugin` is now the only export provided by the `sku/webpack-plugin` entrypoint.

**MIGRATION GUIDE**:

```diff
-import SkuWebpackPlugin from 'sku/webpack-plugin';
+import { SkuWebpackPlugin } from 'sku/webpack-plugin';
```
