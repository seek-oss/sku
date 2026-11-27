---
'sku': minor
---

Managed Data Mode SSR: Serve `/livez` and `/readyz` from the sku server

`GET` and `HEAD /livez` return 200 `ok` when the process can respond, including during shutdown.
`GET` and `HEAD /readyz` return 503 `unavailable` until `onListen` returns, then 200 `ok`, and 503 again on `SIGTERM` or `SIGINT`.
Other methods on those paths return 405 with `Allow: GET, HEAD`.

`sku start` and the production server answer both routes ahead of your middleware.
There is no app callback on either route. Use `onListen` for one-time startup work.
