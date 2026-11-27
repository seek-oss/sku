## Why

Serve Kubernetes-style `/livez` and `/readyz` probes for Managed Data Mode SSR apps, so a platform can probe any app on the same paths without an app callback that can check databases or APIs.

A platform can send requests before the server has finished `onListen`, and it can keep sending them during shutdown. Liveness and readiness need different answers.

## What Changes

- Sku answers `GET` and `HEAD /livez` and `GET` and `HEAD /readyz` ahead of request context, static files, Vite, dev server middleware, and app middleware, on `sku start` and the production server.
- `/livez` returns 200 `ok` whenever the handler runs, including during drain. It does no I/O.
- `/readyz` returns 503 `unavailable` until the server is listening and `onListen` has returned, then 200 `ok`. It returns 503 again on `SIGTERM` or `SIGINT`.
- Other methods on those paths return 405 with `Allow: GET, HEAD` and do not fall through. `/health`, `/healthz`, and `/startupz` are not sku routes.
- Responses use `Content-Type: text/plain; charset=utf-8` and `Cache-Control: no-store`. Bodies are `ok` or `unavailable`.
- Sku logs readiness state transitions and does not log each 200. There is no app callback.
- Docs describe the probes. Sku minor changeset.

## Non-goals

- An `isReady` callback, or any other probe callback.
- `/health`, `/healthz`, or `/startupz`.
- Ongoing dependency health checks.
- A separate port for the probes.
- Logging individual probe responses.
- Restricting who can call the probes.
- Probe routes for webpack SSR.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `ssr`: `/livez` and `/readyz` on `sku start` and the production server.

## Impact

- `sku start` and production server middleware order.
- SSR middleware and entries docs.
