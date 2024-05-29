---
'sku': patch
---

Enable `babel-loader` cache

Sku's webpack configuration now emits a `babel-loader` cache to `node_modules/.cache/babel-loader`. The primary use case for this cache is speeding up production builds. It can also speed up local development in situations where the webpack cache is invalidated.
