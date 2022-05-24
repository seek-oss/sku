---
'sku': patch
---

Allow `:` to be used in dynamic paths again.

Previously, dynamic paths were declared using the standard `:param` syntax, but this had been deprecated in favour of `$param`.

This has now been updated to allow for both.
This should allow `sku serve` to work for projects using colon syntax.
