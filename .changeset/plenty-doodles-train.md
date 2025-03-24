---
'sku': patch
---

Re-order root resolution file extensions in order of most common to least common file types

Files with no extension will now be resolved in the following order: `.ts` ->  `.tsx` ->  `.mts` ->  `.cts` ->  `.js` ->  `.jsx` ->  `.mjs` ->  `.cjs` -> `.json`
