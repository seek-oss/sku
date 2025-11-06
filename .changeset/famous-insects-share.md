---
'@sku-lib/vitest': patch
'sku': patch
---

test(vitest): Vitest now works for React apps

The vitest runner wasn't inheriting the vite config so many vitest plugins, including React, were missing. This has now been resolved.
