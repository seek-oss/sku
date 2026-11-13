---
'sku': patch
---

Fix more cases where Vanilla Extract packages are missing from the server build.

Packages whose `exports` field doesn't include `./package.json` were skipped when working out which dependencies to bundle.
