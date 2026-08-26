---
'pnpm-plugin-sku': patch
'@sku-lib/create': patch
---

Stop writing pnpm 10-only settings into `pnpm-workspace.yaml`

`ignorePatchFailures` and `packageManagerStrictVersion` were removed in pnpm 11, which is what `@sku-lib/create` pins for new apps. Leaving them in the default config made pnpm warn that the settings were unrecognized.
