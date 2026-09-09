---
'@sku-lib/create': patch
---

Pin new pnpm apps to sku's `packageManager` version, instead of the running CLI or npm's `latest-11` tag.

Looking up `latest-11` or using the invoking pnpm can disagree with sku's pin (for example 11.26.0 vs 11.24.0 in CI). `pnpm add` then tried to switch versions and failed under `pnpm/action-setup`.
