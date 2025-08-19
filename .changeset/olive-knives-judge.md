---
'sku': patch
---

Don't emit `.npmrc` validation warning on CI

`.npmrc` files may be generated on CI, causing a false positive
