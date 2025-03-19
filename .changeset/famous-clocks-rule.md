---
'sku': patch
---

`vite`: Emit more accurate HMR rebuild timing metrics

Previously this metric was captured server-side by relying on plugin hooks firing in the correct order. This proved to be inaccurate, so we now capture this metric client-side and send the data back to the dev server.
