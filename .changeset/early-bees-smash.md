---
'sku': patch
---

`configure`: No longer prompt to install `pnpm-plugin-sku`

The `configDependencies` pnpm-workspace property has issues on Renovate/Mend, causing automated dependency management to fail. Until the issue with Renovate is resolved `sku` will not prompt to install `pnpm-plugin-sku` when running `sku configure`
