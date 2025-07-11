---
'sku': minor
---

Explicitly deny commands unsupported by the vite bundler

While experimental support with Vite is available, some APIs are still under development. Static site generation is our primary focus for the Vite bundler at this time, so SSR commands with the experimental Vite bundler flags will now throw an error. Disable the experimental vite mode to continue using sku in SSR apps.
