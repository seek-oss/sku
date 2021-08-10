---
'sku': minor
---

Move to faster source maps setting in development

Previously sku used `inline-source-map` in development which is very slow, particularly for rebuilds. Development source maps now use `eval-cheap-module-source-map`.