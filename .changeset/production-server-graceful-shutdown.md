---
'sku': minor
---

Managed Data Mode SSR: Shut down gracefully on `SIGTERM`, with a new `onShutdown` hook

The production server now waits for in-flight requests to finish before exiting, then calls `onShutdown` so you can flush telemetry. If your app has its own `SIGTERM` handler, move that work into `onShutdown` instead, as the server won't start while another handler is registered.

The production server now keeps keep-alive connections open for 35 seconds by default. `sku start` is unchanged. If you increase `keepAliveTimeout` in `onListen`, make sure `headersTimeout` is higher.
