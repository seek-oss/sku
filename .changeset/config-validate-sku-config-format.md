---
'sku': major
---

`config`: Deprecate CommonJS `module.exports` format for sku configs

**BREAKING CHANGE**:

Sku config files must now be ESM syntax. If CommonJS is used, `sku` will display a banner and exit.

```diff
-module.exports = {
+export default {
  ...,
};
```
