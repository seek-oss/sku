# Deploy to production

:::danger Experimental — not for production
Managed Data Mode SSR is available for evaluation and testing. Do not use it in production yet; the API and behaviour may change.
In the meantime, continue using [Webpack SSR](./webpack-ssr.md).
:::

`sku build` emits sibling directories under the build target (for example `dist/`):

- `client/` — hashed browser assets
- `server/` — runnable Node server (`server.js`) and SSR bundle

```sh
sku build
node dist/server/server.js
# optional: PORT=8080 node dist/server/server.js
```

Production listens on `process.env.PORT` when set, otherwise the config [`port`](../configuration.md#port) (default `8080`).

## Stand-alone server

When a sibling `client/` directory exists next to `server/`, sku mounts `express.static` for `publicPath` **before** server-entry middleware so Node can serve hashed assets itself.
That lets you run `dist/server/` + `dist/client/` as a stand-alone server — useful for local production smoke tests and simple demos.

This is **not** recommended for production-grade deployments.

See [Middleware](./middleware.md#mount-order-in-production) for mount order.

## Behind reverse proxy

sku’s hashed client assets under `dist/client/` are optimised to live in persistent object storage (for example AWS S3, GCS, or Azure Blob) and be served by a reverse proxy or CDN in front of Node.

Typical layout:

1. Run `sku build`.
2. Upload the contents of `dist/client/` to your bucket or origin (often under a key prefix that matches `publicPath`, for example `static/`).
3. Deploy `dist/server/` **plus production `node_modules`**.
4. Put a reverse proxy or CDN in front that serves `publicPath` from that storage and forwards everything else to the Node server.
