---
'sku': major
---

Drop explicit file extensions when calling `prettier`

**BREAKING CHANGE**:

`sku` no longer passes explicit extensions to `prettier` during `sku lint`/`sku format`. Instead, your application's root directory will be the target, and `prettier` will format all files it supports. This may result in some files being formatted that were not previously formatted by `prettier`.
