---
'sku': patch
---

Fix more cases where Vanilla Extract packages are missing from the server build

When sku chooses which dependencies to bundle, it now includes packages whose `exports` field leaves out `./package.json`.
