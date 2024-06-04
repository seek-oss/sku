---
'sku': minor
---

Add support for `--watch` flag to `sku translations compile`

The `sku translations compile` command now accepts a `--watch` flag. When this flag is provided, `translations.json` files will be re-compiled whenever changes are detected.

**EXAMPLE USAGE**:

```sh
sku translations compile --watch
```
