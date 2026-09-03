---
'sku': minor
---

Managed Data Mode root layouts now own the HTML document element tree (`<html>`, `<head>`, `<body>`). Sku no longer wraps documents in an internal `Document` shell. Document stylesheet and `modulepreload` links are emitted via `<HeadAssets />` from `sku/runtime`.
