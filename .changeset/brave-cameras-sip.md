---
'sku': patch
---

`sku init`: Add a `pnpm.onlyBuiltDependencies` field to the `package.json` file if `pnpm` v10 is detected

As of [`pnpm` v10], dependency lifecycle scripts are no longer run by default. Instead, explicit permission must be given on a per-dependency basis.

New `sku` projects will have this field added automatically if `pnpm` v10 is detected in order to ensure `sku` and its dependencies can run necessary lifecycle scripts after installation.

[`pnpm` v10]: https://github.com/pnpm/pnpm/releases/tag/v10.0.0
