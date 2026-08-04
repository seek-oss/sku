---
'sku': patch
---

`getCspNonce`: Export only from `sku/runtime`

`getCspNonce` is no longer re-exported from the main `sku` entry.
Import it from `sku/runtime` alongside other Managed Data Mode helpers.

This tightens the experimental SSR surface before production.
`req.getCspNonce()` on Express middleware is unchanged.
