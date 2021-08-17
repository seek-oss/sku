---
'sku': patch
---

Update svgo config to remove deprecated "extendDefaultPlugins" utility.

This requires svgo@2.4.0, so `Unknown builtin plugin "preset-default" specified` errors can be fixed by refreshing the lockfile.
