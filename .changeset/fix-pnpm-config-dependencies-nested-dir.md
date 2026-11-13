---
'sku': patch
---

Fix `pnpm-plugin-sku` being reported as missing when the app is not at the workspace root

The check now runs from the workspace root, so it behaves the same on pnpm 11 and pnpm 12.
