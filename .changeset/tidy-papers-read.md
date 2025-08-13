---
'sku': patch
---

`sku init`: Specify an exact version of `sku` when installing dependencies

This fixes an issue where running `sku init` with a snapshot version of `sku` would install the latest version of `sku` instead of the specified version.
