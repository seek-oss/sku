---
'sku': patch
---

`vite`: Clear render timeout after successful `renderToStringAsync`

Vite apps that use `renderToStringAsync` were being artificially slowed down by a 5 second timeout that was not being cleared.
