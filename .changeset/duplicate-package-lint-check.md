---
'sku': minor
---

`sku lint`: Warn about duplicate and mismatched package versions

Lint now checks  `react`, `react-dom`, `braid-design-system`, `@vanilla-extract/css` and your compile packages for duplicate and mismatched versions.
The warnings never fail lint and can be turned off completely with `skuSkipValidatePeerDeps` in `package.json`.

This replaces the duplicate package warnings in `sku start`, `sku build` and `sku serve`, which didn't run with pnpm.
The new check works with pnpm, npm and yarn.
