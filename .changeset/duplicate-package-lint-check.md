---
'sku': minor
---

Warn on duplicate packages during `sku lint`. Full `sku lint` runs now warn (without failing lint) when `react`, `react-dom`, `braid-design-system`, `@vanilla-extract/css`, or any of your compile packages (including `@seek` packages flagged as sku compile packages) resolve to more than one distinct version in your dependency graph, when `react` and `react-dom` versions mismatch, or when a compile package's peer dependency resolves outside its declared range. This works with pnpm, npm, and yarn. Set `skuSkipValidatePeerDeps` in `package.json` to opt out.

The previous duplicate-package warnings shown during `sku start`, `sku build`, and `sku serve` have been removed; `sku lint` is now the only place these warnings are reported.
