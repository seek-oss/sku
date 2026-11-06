## Why

Webpack SSR `onStart` receives only the Express app.
The listening Node server stays inside sku, so apps cannot set `keepAliveTimeout` or close the server on `SIGTERM`.
Managed Data Mode already passes that server through `onListen`.

## What Changes

- Webpack SSR `onStart` takes the Express app as its first argument.
- A second argument carries `httpServer` and the bound `port`.
- `httpServer` is the `http.Server` or `https.Server` that called `listen`.
- Sku calls `onStart` once, after `listen` succeeds, in `sku start-ssr` and in `node ./dist/server.js`.
- If `onStart` returns a promise, sku awaits it.
- A throw or rejection fails startup.
- Webpack SSR docs show `httpServer.keepAliveTimeout` and a `SIGTERM` `httpServer.close()` example.
- Callbacks that use only the Express app are valid.

## Non-goals

- Sku-owned `SIGTERM` handling or a forced graceful shutdown.
- Changing Managed Data Mode `onListen`.
- Calling `onStart` on server hot reload.
- Replacing the first argument with an argument bag.

## Capabilities

### New Capabilities

- `webpack-ssr`: Webpack SSR `onStart` receives the Express app, then the listening server and the bound port, after `listen` succeeds.

### Modified Capabilities

- None.

## Impact

- Public `Server['onStart']` type in `sku`.
- Webpack SSR server entry (`listen` callback passes the server handle).
- `site/docs/ssr/webpack-ssr.md`.
- Webpack SSR fixtures that log from `onStart` are valid when they ignore the second argument.
- Sku minor changeset.
