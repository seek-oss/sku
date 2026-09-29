---
'sku': minor
---

`pathAliases` syncing has moved to `sku format`, and `sku lint` fails when out of sync.

Sku previously forced syncing of `package.json#imports` on install and before every command, but now only runs on `sku format` (to sync) and `sku lint` (to check).

Commands that resolve `#` imports run the lint check so missed entries are detected, rather than silently modifying the file.

Since syncing was forced previously on every command, no breaking changes are expected.
