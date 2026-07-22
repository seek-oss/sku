# Deploy to production

`sku build` emits sibling directories under the build target (e.g. `dist/`):

- `client/` — browser assets and the Vite client manifest
- `server/` — runnable Node server entry (`server.js`) and SSR bundle

```sh
sku build
node dist/server/server.js
# optional: PORT=8080 node dist/server/server.js
```

Deploy both `client/` and `server/` together.
Client assets are served from `dist/client/` under the relative `publicPath`.
Absolute / CDN `publicPath` is not supported for SSR.
During `sku start`, the Vite module graph is served from `/` and config `publicPath` is ignored until production.

Production listens on `process.env.PORT` when set, otherwise the config [`port`](../configuration.md#port) baked at build time (default `8080`).
The same `port` is used for `sku start`.
[`serverPort`](../configuration.md#serverport) is Webpack-SSR-only and is rejected for SSR.
