---
'sku': minor
'@sku-lib/create': patch
---

Managed Data Mode root layouts now need to render the full `<html>`, `<head>`, and `<body>`, not just inside the `<body>`. Allowing it to render into any part of document. 