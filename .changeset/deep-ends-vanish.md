---
'sku': minor
---

Add warnings for unnecessary polyfills during development. `sku start` and `sku start-ssr`, along with `sku build` and `sku build-ssr` now warn about polyfills that are no longer needed for modern browsers to help reduce bundle sizes.