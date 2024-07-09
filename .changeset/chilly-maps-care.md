---
'sku': major
---

Export jest preset path

**BREAKING CHANGE**:

The jest preset is now accessible via a relative path rather than pointing to a module. This may affect users that require a jest config for debugging tests in their IDE. See the [testing documentation] for more information.

**MIGRATION GUIDE**:

```diff
// jest.config.js
+ const { preset } = require('sku/config/jest');

/** @type {import('jest').Config} */
module.exports = {
-  preset: 'sku/config/jest',
+  preset,
};
```

[testing documentation]: https://seek-oss.github.io/sku/#/./docs/testing
