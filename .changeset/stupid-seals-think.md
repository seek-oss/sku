---
'sku': major
---

Remove support for `persistentCache` configuration option

**BREAKING CHANGE:**

Disabling `persistentCache` was previously necessary when using [treat], which is no longer supported in `sku`. `persistentCache` is now always enabled and has been removed from the configuration options.

[treat]: https://seek-oss.github.io/treat/

**MIGRATION GUIDE:**

Remove the `persistentCache` option from your sku config.

```diff
// sku.config.ts

import { type SkuConfig } from 'sku';

export default {
- persistentCache: false,
- persistentCache: true,
} satisfies SkuConfig;
```