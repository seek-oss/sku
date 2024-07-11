---
'sku': major
---

Remove support for `orderImports` config option

**BREAKING CHANGE:**

`orderImports` is now always enabled and has been removed from the configuration options.

**MIGRATION GUIDE**

> To reduce the number of changes when migrating to sku 13 you may choose to enable `orderImports` and run sku format before upgrading.

Remove `orderImports` from `sku.config.ts`
```diff
// sku.config.ts

import { type SkuConfig } from 'sku';

export default {
- orderImports: false,
- orderImports: true,
} satisfies SkuConfig;
```

Then run `sku format`

**Note:**

Changing import order can affect the behaviour of your application. After running sku format, please ensure your app still works and looks as expected.

Any existing comments (e.g. `@ts-ignore`) above imports will **not** be moved as part of the autofix. If your app has `@ts-ignore` comments above import statements then these will need be moved manually.
