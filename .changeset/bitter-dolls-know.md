---
'sku': minor
---

Expose named `SkuWebpackPlugin` export from `sku/webpack-plugin`, deprecate default export

**MIGRATION GUIDE**
```diff
-import SkuWebpackPlugin from 'sku/webpack-plugin';
+import { SkuWebpackPlugin } from 'sku/webpack-plugin';
```
