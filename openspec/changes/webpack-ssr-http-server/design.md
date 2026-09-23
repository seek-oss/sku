## Context

See proposal.md for why.
`onStart` is called from the Webpack SSR listen callback in `packages/sku/src/services/webpack/entry/server/index.ts`.
That file creates `http.Server` or `https.Server` and passes only the Express `app` into `onStart(app)`.
`Server['onStart']` is `(app: Express) => void`.
Managed Data Mode `onListen` already uses `{ app, httpServer, port }`.
`sku start-ssr` sends `SIGTERM` to the cluster worker and then exits the parent.
Production `node ./dist/server.js` registers no shutdown handler.

## Goals / Non-Goals

**Goals:**

- Pass the server instance that called `listen`, including HTTPS.
- Pass the bound port from that server, not the raw CLI string.
- Accept `onStart` callbacks that take only the Express app.
- Await `onStart` and fail startup on throw or rejection.

**Non-Goals:**

- Registering `SIGTERM` inside sku’s server entry.
- Changing the dev parent’s kill-and-exit sequence.
- Re-invoking `onStart` from the hot-reload accept handler.
- A sku major release.

## Decisions

### Second argument, not a breaking change

Change `onStart` to:

```ts
onStart?: (
  app: Express,
  server: {
    httpServer: http.Server | https.Server;
    port: number;
  },
) => void | Promise<void>;
```

Call it as `await onStart(app, { httpServer: server, port })` inside the listen callback.
Read `port` from `server.address()` when that value is an `AddressInfo`.
Webpack SSR always listens on TCP, so a missing address is a startup failure.

A callback typed as `(app: Express) => void` is assignable.
At runtime, extra arguments are ignored.

Alternative: one bag `{ app, httpServer, port }`, matching `onListen`.
Rejected because it breaks every caller that treats the first argument as Express.
This shouldn't be delayed till the next major.

### Await in the listen callback

The listen callback is an async function that awaits `onStart`.
On throw or rejection, log the error and exit with code 1.
Today a returned promise is ignored, so an async failure does not fail startup.

### Apps own SIGTERM

Do not add a signal listener in the server entry.
Docs show the app registering `SIGTERM`, calling `httpServer.close()`, and then exiting.
`sku start-ssr` kills the worker with `SIGTERM` and exits the parent.
An app handler replaces Node’s default terminate behaviour, so the example must exit after close.

## Risks / Trade-offs

- [Docs set `keepAliveTimeout` on the Express app] → Examples use `httpServer` from the second argument. The first argument is the Express app.
- [An app `SIGTERM` handler never exits] → The cluster worker can outlive `Worker.kill()` until the parent exits. Docs require `close` then `process.exit`.
- [Migration doc shows a one-argument bag] → Map `onStart(app, { httpServer, port })` to `onListen({ app, httpServer, port })`.
