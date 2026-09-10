---
'sku': minor
'@sku-lib/create': patch
---

Managed Data Mode root layouts now own `<html>`, `<head>`, and `<body>`. Sku hoists stylesheet and `modulepreload` links into that `<head>`. The SSR create template matches this: `RootLayout` owns the document and nests `ErrorBoundary` on a child route.
