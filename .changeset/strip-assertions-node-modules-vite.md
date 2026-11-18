---
'sku': patch
---

Vite: Strip `assert` and `invariant` calls from dependencies in production builds

Previously, assertions were only removed from your own code, which could leave them in the bundle for packages like `braid-design-system`. This now matches the webpack behaviour.
