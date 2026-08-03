# Deploy to production

:::danger Experimental — not for production
SSR with Managed Data Mode is available for evaluation and testing. Do not use it in production yet; the API and behaviour may change.
In the meantime, continue using [Webpack SSR](./webpack-ssr.md).
:::

`sku build` emits sibling directories under the build target (for example `dist/`):

- `client/` — browser assets and the Vite client manifest
- `server/` — runnable Node server (`server.js`) and SSR bundle

```sh
sku build
node dist/server/server.js
# optional: PORT=8080 node dist/server/server.js
```

Deploy both `client/` and `server/` together.
Client assets are served from `dist/client/` under the relative `publicPath`.

Production listens on `process.env.PORT` when set, otherwise the config [`port`](../configuration.md#port) (default `8080`).
The same `port` is used for `sku start`.

## Deploy client assets to persistent storage

Hashed files under `dist/client/` are safe to upload to persistent object storage (for example AWS S3, GCS, or Azure Blob) so assets survive redeploys and can be shared across instances.

Keep [`publicPath`](../configuration.md#publicpath) **relative** (for example `/` or `/static/`).
Do not point `publicPath` at an `https://…` bucket or CDN URL — SSR does not support absolute asset bases.

Typical layout:

1. Run `sku build`.
2. Upload the contents of `dist/client/` to your bucket (often under a key prefix that matches `publicPath`, for example `static/`).
3. Deploy `dist/server/` (and usually a local copy of `dist/client/` as well) so `node dist/server/server.js` can still serve assets via `express.static`.
4. Put a reverse proxy or CDN in front that routes requests under `publicPath` to object storage, and everything else to the Node server.

Example with the AWS CLI after a build that uses `publicPath: '/static/'`:

```sh
sku build
aws s3 sync dist/client/ s3://my-app-assets/static/ --delete
node dist/server/server.js
```

Browser asset URLs stay on the same origin as the HTML (under `publicPath`).
The edge layer resolves those paths to stored objects; the Node process remains a valid origin for the same paths when traffic reaches it directly.

Prefer long-lived cache headers for hashed files in the bucket.
Keep deploying `server/` and `client/` together so a cold instance can still hydrate without waiting on the edge.
