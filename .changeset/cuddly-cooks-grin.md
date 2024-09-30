---
'sku': patch
---

Disable `babel-loader` cache compression

`sku` applications tend to transpile many modules and upload all cache files as a single compressed file. This makes compressing each individual cache file superfluous, so this feature has been disabled.
