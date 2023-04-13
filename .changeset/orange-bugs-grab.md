---
'sku': patch
---

start-ssr: Enable `devServerMiddleware` to serve static assets

Apply `devServerMiddleware` before sku static asset middleware, to support consumers serving custom static assets.
