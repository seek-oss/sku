---
'sku': patch
---

Replace `sku/config/jest` entrypoint with `sku/jest-preset`

**BREAKING CHANGE FOR CUSTOM JEST CONFIG**:

This breaking change will only affect a very small number of projects that have a custom Jest configuration/wish to debug tests in their IDE, and it is intended to be a quick fix/improvement for a feature released in `sku@13.0.0`. Therefore, it's not being released as a major version.

The `sku/config/jest` entrypoint has been removed in favor of a new `sku/jest-preset` entrypoint. The `sku/jest-preset` module is a better way to expose a [jest preset], rather than a relative path (the previous implementation), as it works even if `sku` is hoisted to a parent `node_modules` directory.

**MIGRATION GUIDE**:

```diff
// jest.config.js
- const { preset } = require('sku/config/jest');

/** @type {import('jest').Config} */
module.exports = {
   // If you've already migrated to sku v13
-  preset,
   // If you're still on sku v12.x
-  preset: 'sku/config/jest',
+  preset: 'sku',
};
```

[jest preset]: https://jestjs.io/docs/configuration#preset-string
