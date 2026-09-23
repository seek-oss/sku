## 1. onStart arguments

- [x] 1.1 Change `Server['onStart']` to `(app, { httpServer, port })` returning `void | Promise<void>`
- [x] 1.2 Pass the Express app first and `{ httpServer, port }` second, with `port` from `server.address()`
- [x] 1.3 Await `onStart` and exit 1 on throw or rejection

## 2. Tests

- [x] 2.1 Extend the `ssr-hello-world` production `onStart` assertion so the log includes the bound port and the listening server
- [x] 2.2 Extend the HTTPS fixture `onStart` log so a test can tell the listening server is HTTPS

## 3. Docs and release

- [x] 3.1 Update Webpack SSR `onStart` examples to set `httpServer.keepAliveTimeout` and to `close` that server on `SIGTERM` before exiting
- [x] 3.2 Map webpack `onStart(app, { httpServer, port })` to `onListen({ app, httpServer, port })`
- [x] 3.3 Add a sku minor changeset for the added `onStart` argument
