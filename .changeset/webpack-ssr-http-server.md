---
'sku': minor
---

Pass the http server and port to Webpack SSR `onStart`.

`onStart` still receives the Express app first.
A second argument now carries `{ httpServer, port }`.
