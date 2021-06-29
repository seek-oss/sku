---
'sku': minor
---

Upgrade to Prettier 2.3

This fixes an issue where `.node_modules/bin/prettier` points to
`sku#playroom#prettier@2.3` while Sku lints using `prettier@2.2`.

In particular, this confuses the Visual Studio Code Prettier extension
in to formatting using 2.3 which then fails 2.2's lint.

This will require consumers to run `yarn format` to adopt the new
Prettier rules.
