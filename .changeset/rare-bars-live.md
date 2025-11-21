---
'sku': patch
---

The peer dependency for `@sku-lib/vitest` now requires the latest version.

To avoid version mismatches, when upgrading `sku`, you should also upgrade all related `@sku-lib/*` packages. The peer dependency requirements for these packages have been updated to always reference their latest released version, making this relationship more explicit.
