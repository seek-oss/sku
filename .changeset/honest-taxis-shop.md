---
'sku': patch
---

Allow Webpack to interpret all `.mjs` files as modules, not just those from `node_modules`

This fixes an error with compiled Vocab translation files because Webpack would not parse `require.resolveWeak` in `.mjs` files.
