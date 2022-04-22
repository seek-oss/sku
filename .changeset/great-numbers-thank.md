---
'sku': patch
---

Exclude playroom from vanilla-extract pipeline

TL;DR Only affects consumers using running Playroom along side sku — i.e. Braid.

Due to the current pattern used for the virtual file paths of vanilla-extract's generated stylesheets, we are manually excluding Playroom’s vanilla-extract styles.

In the future, we are planning to use more realistic virtual file paths, which should honour the default handling of include/exclude path matching and make this work around no longer necessary.
