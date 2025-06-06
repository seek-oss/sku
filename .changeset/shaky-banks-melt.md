---
'sku': patch
---

Revert addition of `--disable-warning` flag to `sku` binary

This flag was added to suppress certain warnings about experimental features being used by `sku`. However, the method use to set this flag is not compatible with certain distributions of Linux without additional configuration, so it has been removed.
