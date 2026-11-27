# Tasks

## 1. Routes

- [x] 1.1 Mount `GET` and `HEAD /livez` and `/readyz` first on the production server and on `sku start`, ahead of request context, static files, Vite, and dev server middleware. Other methods return 405 with `Allow: GET, HEAD` and do not fall through. `/health`, `/healthz`, `/startupz`, and subpaths reach the app. Verify: with app middleware that answers every other path, both probes are answered by sku on both servers.
- [x] 1.2 `GET` and `HEAD /livez` return 200 `ok` whenever the handler runs, including during `onListen` and drain, with `Content-Type: text/plain; charset=utf-8` and `Cache-Control: no-store`. The handler does no I/O. Verify: a request during a slow `onListen` gets 200, and a request on an open socket during drain gets 200.
- [x] 1.3 `GET` and `HEAD /readyz` return 503 `unavailable` until `onListen` has returned, then 200 `ok`. On `SIGTERM` or `SIGINT` they return 503 immediately. Sku logs the state transition and does not log each 200. There is no app callback. Verify: a request during a slow `onListen` gets 503, a later request gets 200 without a per-request log, and a request on an open socket during drain gets 503.

## 2. Docs and release

- [x] 2.1 Document `/livez` and `/readyz` in the SSR middleware and entries docs. Verify: the docs build passes.
- [x] 2.2 Add a sku minor changeset. Verify: `pnpm changeset status` lists it.
