---
'sku': patch
'@sku-lib/create': patch
---

Improve package manager detection

Sku now works out which package manager your project uses from its `packageManager` field or lockfile, before falling back to the package manager that invoked sku. This should improve the accuracy of sku's output when running from a coding agent.
