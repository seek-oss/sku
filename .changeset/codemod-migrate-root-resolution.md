---
'@sku-lib/codemod': minor
---

Add `migrate-root-resolution` codemod

Migrates projects away from `sku`'s `rootResolution` feature to native [subpath imports](https://nodejs.org/api/packages.html#subpath-imports).
The codemod rewrites `src/...` imports to `#src/...`, and adds a `{ pathAliases: { "#src/*": "./src/*" } }` entry to your sku config.
