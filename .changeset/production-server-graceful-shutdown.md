---
'sku': minor
---

Managed Data Mode SSR: Shut down the production server gracefully on `SIGTERM`, and add an `onShutdown` server entry hook

On `SIGTERM`, the production server stops accepting connections, waits for in-flight requests to finish, then calls `onShutdown` so you can flush telemetry.
It exits with code 1 if `onShutdown` throws, or if shutdown takes longer than 25 seconds.

`sku start` and the production server now fail to start if a `SIGTERM` listener is registered after `onListen`.
Move that work into `onShutdown`.

The production server now keeps keep-alive connections open for 35 seconds by default (previously Node's default of 5 seconds).
`sku start` still uses Node's default.
You can still set a different `keepAliveTimeout` in `onListen`.
