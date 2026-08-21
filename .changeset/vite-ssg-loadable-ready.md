---
'@sku-lib/vite': patch
'sku': patch
---

Fix Vite SSG hydration racing ahead of translation and loadable chunks

Sku's Vite client now waits for Collector-registered chunk scripts (tagged with `data-chunk`) to evaluate before hydrating, matching webpack's `loadableReady` behaviour. This prevents hydration mismatches in multi-language SSG apps when the vocab language chunk has not run yet.
