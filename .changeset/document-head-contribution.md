---
'sku': minor
'@sku-lib/create': patch
---

Managed Data Mode root layouts now own `<html>`, `<head>`, and `<body>`. Sku hoists stylesheet and `modulepreload` links into that `<head>` — there is no consumer `HeadAssets` component. The SSR create template matches this: `RootLayout` owns the document without `HeadAssets` and nests `ErrorBoundary` on a child route.
