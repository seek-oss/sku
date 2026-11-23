## Why

The Managed Data Mode production server exits as soon as it receives `SIGTERM`, so in-flight responses are cut and buffered telemetry is lost. Its keep-alive timeout is Node's 5 seconds, shorter than the idle timeout of a proxy or service mesh that holds connections for about 30 seconds, so the proxy can send a request onto a socket Node has just reset. Container platforms such as Kubernetes send `SIGKILL` about 30 seconds after `SIGTERM` and expect the app to drain, flush and exit first.

## What Changes

- Production sets `keepAliveTimeout` to 35 seconds before `onListen`. `onListen` may change it.
- Production registers one `SIGTERM` listener. It stops accepting, closes idle sockets, lets in-flight responses finish and closes their sockets, awaits optional `onShutdown`, and exits 0. It exits 1 when this takes longer than 25 seconds.
- Startup fails in production when a `SIGTERM` listener already exists.
- Docs show how to start and flush telemetry clients in `onShutdown`. Sku minor changeset. SSR is experimental, so this is not marked breaking.

## Non-goals

- Configuring the 25 second deadline. Deferred until an app runs on a platform whose grace period is not 30 seconds.
- Keep-alive or `SIGTERM` handling in `sku start`, or in webpack SSR.
- Changing or checking `headersTimeout` or `requestTimeout`. Neither applies to an idle keep-alive socket.
- Starting, detecting, flushing, or warning about OpenTelemetry or any other telemetry client.
- A hook that replaces sku's drain.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `ssr`: production keep-alive, the `SIGTERM` drain and its deadline, and shutdown docs.
- `managed-data-mode`: the server entry may include `onShutdown`.

## Impact

- Production listen path, `defineServerEntry` and `SkuServerEntry`.
- SSR entries docs lose the 20 second keep-alive example. The logging docs gain the shutdown flush shapes: one promise example, one callback example, and the other clients named.
