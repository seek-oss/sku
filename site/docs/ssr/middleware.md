# Middleware

SSR has three places to run middleware — pick the one that matches the job:

1. **Server-entry `middleware`** — production and start; request context before HTML render
2. **Config `devServerMiddleware`** — `sku start` only; local mocks and proxies
3. **React Router route middleware** — isomorphic behaviour on matched routes (see [Routing](./routing.md#react-router-route-middleware))

## Server-entry middleware

Export Connect/Express handlers from the server entry.
sku mounts them before the HTML render path in both `sku start` and production.

```tsx
import { defineServerEntry } from 'sku/ssr';

const server = defineServerEntry({
  middleware: [
    (req, res, next) => {
      req.user = { id: '…' }; // after Express Request module augmentation
      if (req.path === '/api/health') {
        res.status(200).type('text/plain').send('ok');
        return;
      }
      next();
    },
  ],
});

export default server;
```

Use this for production request handlers and for attaching values on `req` that [entry getters](./entries.md) (or server `getRouterContext`) will read.
For typing those fields, see [Typing middleware-attached fields](./entries.md#typing-middleware-attached-fields-on-req).

Do not put raw Express `req` into React Router context — project values via dual-entry [`getRouterContext`](./data-loading.md#router-context).

SSR runs **Express 4**. Type middleware against Express 4 (`SkuSsrMiddleware` / `@types/express` major 4).

## Dev-only mocks (`devServerMiddleware`)

Use config [`devServerMiddleware`](../configuration.md#devservermiddleware) for local mocks and proxies that production never serves from the Node app (for example `/api` traffic a reverse proxy handles when deployed).
sku mounts that file only in SSR `sku start`, never in the production server.

```ts
// sku.config.ts
import type { SkuConfig } from 'sku';

export default {
  bundler: 'vite',
  buildType: 'ssr',
  devServerMiddleware: './dev-middleware.js',
} satisfies SkuConfig;
```

```js
// dev-middleware.js
export default (app) => {
  app.get('/mock-api', (_req, res) => {
    res.status(200).type('text/plain').send('ok');
  });
};
```

## Mount order in production

1. Request-context (sku; CSP nonce store, etc.)
2. `express.static` for client assets under [`publicPath`](../configuration.md#publicpath)
3. Server-entry `middleware` (optional)
4. HTML render

Static mounts **before** server-entry middleware so catch-all or Melways-style handlers cannot eat hashed client assets under `publicPath`.
App routes outside that prefix still reach middleware and HTML as usual.

## Mount order in `sku start`

1. Request-context (sku; CSP nonce store, etc.)
2. Config `devServerMiddleware` (optional)
3. Server-entry `middleware`
4. Vite middlewares (HMR / assets)
5. HTML render

Dev mocks mount before production middleware so they can intercept traffic that would never reach the app in production.
`sku start` does not mount `express.static` under `publicPath` — Vite serves the module graph from `/`.
Put anything that must ship in production on the server-entry export; keep stubs and local-only routes in `devServerMiddleware`.
