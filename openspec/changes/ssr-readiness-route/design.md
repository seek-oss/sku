# Design

## Context

Both servers mount request context, static files (production) or Vite and dev server middleware (`sku start`), the app's `middleware`, then the HTML render. The production server opens its port before it awaits `onListen`, so a probe can connect while `onListen` is still running.

## Decisions

### Sku owns `/livez` and `/readyz`

Sku mounts both routes ahead of `createSsrRequestContextMiddleware()`, static files, Vite, dev server middleware, app middleware, and HTML on both servers. Probes never hit auth, access logging, tracing, or site routing.

`GET` and `HEAD` are the only methods. Any other method returns 405 with `Allow: GET, HEAD` and does not fall through. Subpaths such as `/livez/other` still reach the app. `/health`, `/healthz`, and `/startupz` are not sku routes, so they do not collide with consumer pages and do not blur restart versus traffic-shedding.

### `/livez` means the process can respond

The handler returns 200 `ok` whenever it runs, including during drain. Reaching it is the check: the process and HTTP event loop can respond. It does no I/O, takes no locks, and calls nothing downstream. A stuck event loop fails the probe by timeout. The process cannot return 503 for that case.

### `/readyz` means listening, started, and not draining

200 only after `listen` has succeeded and `onListen` has resolved, and while the process is not draining. 503 `unavailable` before that, and immediately on `SIGTERM` or `SIGINT`.

There is no app callback. `onListen` covers one-time boot work. An async probe callback invites teams to check databases and APIs and cause cascading outages. A synchronous `isReady?: () => boolean` can be added later if a pod-local post-startup need shows up.

### Fixed response, transition logs

Every probe response sends `Content-Type: text/plain; charset=utf-8` and `Cache-Control: no-store`. Bodies are `ok` or `unavailable`. They do not include versions, commit SHAs, hostnames, dependency names, connection strings, or stack traces.

Sku logs readiness transitions (`starting -> ready`, `ready -> draining`) and does not log individual 200 responses.

### Same port, production drain on both signals

A separate port would make `sku start` and production differ. Production's existing drain runs on `SIGTERM` and `SIGINT`, and flips `/readyz` as it starts. `/livez` stays 200 for that whole drain. `sku start` only flips `/readyz` and then lets the process exit.

## Risks / Trade-offs

- [An app already serves `GET` or `HEAD /livez` or `/readyz`] → sku now answers it. SSR is experimental.
- [A dependency is down after startup] → `/readyz` stays 200. Ongoing dependency checks belong on an app route, not these probes.
