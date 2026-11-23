---
'sku': minor
---

Managed Data Mode SSR: Shut down gracefully on `SIGTERM`, with a new `onShutdown` hook

`sku start` and the production server now fail to start when a `SIGTERM` listener is registered after `onListen`. Move that work into `onShutdown`.

The production server now waits for in-flight requests to finish before exiting, then calls `onShutdown` so you can flush telemetry. It exits 1 if `onShutdown` throws, or if shutdown takes longer than 25 seconds.

The production server now keeps keep-alive connections open for 35 seconds by default. `sku start` keeps Node's default. You can still set a different `keepAliveTimeout` in `onListen`.
