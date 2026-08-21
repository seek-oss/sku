---
'sku': patch
---

`vite`: Fix SSG hydration racing ahead of loadable chunks

The client entrypoint now waits for registered chunk scripts to evaluate before hydrating. This prevents hydration mismatches in multi-language SSG apps when the vocab language chunk has not run yet.
