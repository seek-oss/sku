---
'sku': major
---

Drop explicit extensions from prettier call

`sku` no longer passes explicit extensions to `prettier` during `sku lint`/`sku format`.
Instead, the current working directory will be the target, and `prettier` will format all files it supports.
This may result in some files being formatted that were not previously formatted by `prettier`.
