# Deploy to production

> [!CAUTION]
> Experimental — not for production.
> Managed Data Mode SSR is available for evaluation and testing.
> Do not use it in production yet.
> The API and behaviour may change.
> Until then, continue using [Webpack SSR](./webpack-ssr.md).

`sku build` emits sibling directories under the build target (for example `dist/`):

- `client/` — hashed browser assets
- `server/` — runnable Node server (`server.js`) and SSR bundle

```sh
sku build
node dist/server/server.js
# optional: PORT=8080 node dist/server/server.js
```

Production listens on `process.env.PORT` when you set that variable.
Otherwise it uses the config [`port`](../configuration.md#port) (default `8080`).

## Server output

`dist/server/` is self-contained.
sku bundles your dependencies into it, so it starts with `node server.js` without `node_modules` or a package install.

Deploy tools can rely on:

- `dist/server/server.js` as the entry point
- the client manifest that sku writes inside `dist/server/`
- the `PORT` environment variable

> [!NOTE]
> APM agents that patch `require`, such as `dd-trace`, can't instrument packages that are bundled into `dist/server/`.

## Stand-alone server

When a sibling `client/` directory exists next to `server/`, sku mounts `express.static` for `publicPath` **before** server-entry middleware so Node can serve hashed assets itself.
That lets you run `dist/server/` + `dist/client/` as a stand-alone server.
This is useful for local production smoke tests and simple demos.

This is **not** recommended for production deployments.

See [Middleware → Mount order in production](./middleware.md#mount-order-in-production).

## Behind reverse proxy

sku builds hashed client assets under `dist/client/` for persistent object storage (for example AWS S3, GCS, or Azure Blob).
A reverse proxy or CDN in front of Node then serves those assets.

Typical layout:

1. Run `sku build`.
2. Upload the contents of `dist/client/` to your bucket or origin (often under a key prefix that matches `publicPath`, for example `static/`).
3. Deploy `dist/server/`.
   It doesn't need `node_modules`.
4. Put a reverse proxy or CDN in front that serves `publicPath` from that storage and forwards everything else to the Node server.

You are ready when storage or a CDN serves the hashed assets.
In that layout, only document requests reach Node.

## See also

- [Middleware](./middleware.md#mount-order-in-production) — production mount order
- [Configuration](../configuration.md#publicpath) — relative `publicPath`
- [CSP](./csp.md) — header CSP in production responses
- [Getting started](./) — unsupported absolute `publicPath` and related options
