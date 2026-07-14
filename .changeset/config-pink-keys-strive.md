---
'sku': major
---

`config`: Use async `jiti` API to load sku config

**BREAKING CHANGE**:

`sku` config files are now loaded asynchronously using `sku`'s existing `jiti` dependency. There are no changes expected for consumers, but out of an abundance of caution this change is being released in a major version.
