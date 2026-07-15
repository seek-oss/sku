---
'sku': patch
---

`vite`: Apply `dangerouslySetViteConfig` after internal sku config

Changes made in `dangerouslySetViteConfig` will now be applied after `sku`'s internal vite config. This ensures user-configured overrides are honored regardless of the order of `sku`'s internal vite plugins.
