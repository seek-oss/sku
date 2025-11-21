---
'sku': patch
'@sku-lib/create': patch
---

Remove `@sku-lib/vitest` as a peer dependency.

`@sku-lib/vitest` is now included in the core `sku` package. If you use `testRunner: 'vitest'` in your sku config, simply add `vitest` as a dependency. You can safely remove `@sku-lib/vitest` from your dependencies.
