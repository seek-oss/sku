---
'sku': patch
---

Fix hot reload modules loading as ESM causing Reference Error for type: module packages

When in type: module package hot-module files (`*.hot-update.js`) could be loaded as ESM.
Resulting in a reference error.

**Example Error:**

```js
exports.id = 0;
^
// ReferenceError: exports is not defined
```

Hot reload modules are now exported as `*.hot-update.cjs` to ensure they are loaded as CJS.