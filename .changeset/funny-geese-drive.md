---
'sku': minor
---

Remove `babel-plugin-dynamic-import-node` dependency

This plugin was used to transform dynamic imports into deferred requires within jest tests.
However, dynamic imports are well supported in Node, so this plugin is no longer required.
