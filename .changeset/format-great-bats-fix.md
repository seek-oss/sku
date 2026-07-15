---
'sku': major
---

`format`: Throws if Prettier cannot complete formatting (invalid syntax, missing config, etc.)

**BREAKING CHANGE**

Previously, `sku format` would silently fail if Prettier was unable to complete formatting due to invalid syntax, missing config, etc. This has now been changed to throw an error.
