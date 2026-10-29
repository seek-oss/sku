---
'@sku-lib/vite': patch
---

Skip preload links for manifest assets that aren't images or fonts

Fixes malformed `<link rel="preload" as="undefined" type="undefined">` tags for Vocab language chunks when using Vite 8.3 or later.
