---
'sku': major
---

`lint|format`: Promote `package.json` key sorting lint rule from `warn` to `error`

**BREAKING CHANGE**

Unsorted keys in `package.json` will now be treated as errors. Running `sku format` will automatically fix this error.
